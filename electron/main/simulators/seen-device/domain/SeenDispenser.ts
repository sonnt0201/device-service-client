import { Observable } from "../../../shared/events/Observable";
import { DeviceClock } from "./DeviceClock";
import { SeenDomainEvent } from "./events";
import { ButtonId, ButtonIds } from "./values/ButtonId";
import { PresetKind } from "./values/PresetKind";
import { ScreenText } from "./values/ScreenText";

export type DispenserState =
  | "IDLE"
  | "PRESETTING_COST"
  | "PRESETTING_LIT"
  | "SETTING_PRICE"
  | "PUMPING"
  | "ERROR";

export type NozzleState = "seated" | "lifted";

export interface DispenserSnapshot {
  state: DispenserState;
  nozzle: NozzleState;
  unitPrice: number;
  presetKind: PresetKind;
  presetAmount: number;
  pumpedCost: number;
  pumpedVolume: number;
  screenText: string;
  clockSynced: boolean;
}

const DEFAULT_UNIT_PRICE = 20_000; // VND / litre
const DEFAULT_FLOW = 0.35; // litre / second
const PROGRESS_EMIT_INTERVAL_MS = 100;

/**
 * Aggregate root: a SEEN fuel dispenser with its keyboard, nozzle and pump.
 *
 * This is the authoritative model of what the machine does — keypresses change
 * state and the 7-segment display, lifting the nozzle arms a preset and starts
 * the pump, seating it books the sale. It reproduces the observable behaviour of
 * `../LogiProj_DeviceV2/App/Control/Keyboard/MachineStateService_Seen.c` and
 * `UserOperationService_Seen.c` without re-running their screen inference: the
 * simulator knows the intent directly.
 *
 * All outputs are {@link SeenDomainEvent}s on {@link events}; nothing here knows
 * about TCP.
 */
export class SeenDispenser {
  readonly events = new Observable<SeenDomainEvent>();

  private _state: DispenserState = "IDLE";
  private _nozzle: NozzleState = "seated";
  private _entry = "";
  private _unitPrice = DEFAULT_UNIT_PRICE;
  private _presetKind: PresetKind = PresetKind.NONE;
  private _presetAmount = 0;
  private _pumpedVolume = 0;
  private _pumpedCost = 0;
  private _flowLitrePerSec = DEFAULT_FLOW;

  private _lastScreen = "";
  private _lastTickMs = 0;
  private _lastProgressEmitMs = 0;

  constructor(private readonly _clock: DeviceClock) {}

  // ---------------------------------------------------------------- reads

  get state(): DispenserState {
    return this._state;
  }

  get nozzle(): NozzleState {
    return this._nozzle;
  }

  keyboardScreen(): ScreenText {
    return ScreenText.of(this._renderScreen());
  }

  snapshot(): DispenserSnapshot {
    return {
      state: this._state,
      nozzle: this._nozzle,
      unitPrice: this._unitPrice,
      presetKind: this._presetKind,
      presetAmount: this._presetAmount,
      pumpedCost: Math.round(this._pumpedCost),
      pumpedVolume: Number(this._pumpedVolume.toFixed(3)),
      screenText: this._renderScreen(),
      clockSynced: this._clock.isSynced,
    };
  }

  /** Does the current screen show the requested preset number? (`_validateCompletedJob`) */
  screenShowsNumber(expected: string): boolean {
    const shown = this.keyboardScreen().retrieveNumber().split(".").join("");
    return shown === expected.split(".").join("");
  }

  // ---------------------------------------------------------------- commands

  /**
   * A key was pressed on the keypad (physical operator, or a virtual job step).
   * Mode gating lives in the simulator; by the time we get here the mux allows
   * it.
   */
  pressKey(id: ButtonId): void {
    if (ButtonIds.isValid(id)) {
      this.events.notify({ type: "buttons-pressed", ids: [id], timestampMs: this._clock.now() });
    }

    this._applyKey(id);
    this._emitScreenIfChanged();
  }

  /** Direct convenience for the simulator UI ("set unit price"). */
  configureUnitPrice(vnd: number): void {
    if (Number.isFinite(vnd) && vnd > 0) {
      this._unitPrice = Math.round(vnd);
      this._emitScreenIfChanged();
    }
  }

  configureFlow(litrePerSecond: number): void {
    if (Number.isFinite(litrePerSecond) && litrePerSecond > 0) {
      this._flowLitrePerSec = litrePerSecond;
    }
  }

  liftNozzle(): void {
    if (this._nozzle === "lifted") return;
    this._nozzle = "lifted";

    const now = this._clock.now();

    if (
      (this._state === "PRESETTING_COST" || this._state === "PRESETTING_LIT") &&
      this._presetAmount > 0
    ) {
      // arming a preset -> this is the firmware's MachinePresetCallback (CMD 0x13)
      this.events.notify({
        type: "preset-entered",
        kind: this._presetKind,
        value: this._presetValueString(),
        timestampMs: now,
      });
    } else {
      this._presetKind = PresetKind.NONE;
      this._presetAmount = 0;
    }

    this._pumpedVolume = 0;
    this._pumpedCost = 0;
    this._lastTickMs = now;
    this._state = "PUMPING";
    this.events.notify({ type: "pump-started", timestampMs: now });
    this._emitScreenIfChanged();
  }

  seatNozzle(): void {
    if (this._nozzle === "seated") return;
    this._nozzle = "seated";

    if (this._state === "PUMPING") {
      const now = this._clock.now();
      this.events.notify({
        type: "sale-completed",
        cost: Math.round(this._pumpedCost),
        volume: Number(this._pumpedVolume.toFixed(3)),
        price: this._unitPrice,
        timestampMs: now,
      });
      this._state = "IDLE";
      this._entry = "";
      this._presetKind = PresetKind.NONE;
      this._presetAmount = 0;
    }
    this._emitScreenIfChanged();
  }

  /** Drive the pump ramp; call every simulator frame. */
  tick(nowMs: number): void {
    if (this._state !== "PUMPING" || this._nozzle !== "lifted") {
      this._lastTickMs = nowMs;
      return;
    }

    const dtSec = Math.max(0, (nowMs - this._lastTickMs) / 1000);
    this._lastTickMs = nowMs;

    const targetVolume = this._targetVolume();
    if (targetVolume !== null && this._pumpedVolume >= targetVolume) {
      return; // preset reached: valve closed, waiting for the operator to seat
    }

    this._pumpedVolume += this._flowLitrePerSec * dtSec;
    if (targetVolume !== null && this._pumpedVolume > targetVolume) {
      this._pumpedVolume = targetVolume;
    }
    this._pumpedCost = this._pumpedVolume * this._unitPrice;

    if (nowMs - this._lastProgressEmitMs >= PROGRESS_EMIT_INTERVAL_MS) {
      this._lastProgressEmitMs = nowMs;
      this.events.notify({
        type: "pump-progressed",
        cost: Math.round(this._pumpedCost),
        volume: Number(this._pumpedVolume.toFixed(3)),
        price: this._unitPrice,
      });
    }
    this._emitScreenIfChanged();
  }

  raiseError(code = "E 08"): void {
    this._state = "ERROR";
    this.events.notify({ type: "machine-errored", code, timestampMs: this._clock.now() });
    this._emitScreenIfChanged();
  }

  clearError(): void {
    if (this._state === "ERROR") {
      this._state = "IDLE";
      this._entry = "";
      this._emitScreenIfChanged();
    }
  }

  // ---------------------------------------------------------------- internals

  private _applyKey(id: ButtonId): void {
    // C clears everything unless pumping (firmware guard)
    if (id === ButtonId.C) {
      if (this._state === "PUMPING") return;
      this._state = "IDLE";
      this._entry = "";
      this._presetKind = PresetKind.NONE;
      this._presetAmount = 0;
      return;
    }

    if (this._state === "ERROR") return;

    if (id === ButtonId.P) {
      this._state = "SETTING_PRICE";
      this._entry = "";
      return;
    }

    if (ButtonIds.isCostPresetStarter(id) && this._state !== "PUMPING") {
      this._state = "PRESETTING_COST";
      this._presetKind = PresetKind.COST;
      this._entry = "";
      this._presetAmount = 0;
      return;
    }
    if (id === ButtonId.L && this._state !== "PUMPING") {
      this._state = "PRESETTING_LIT";
      this._presetKind = PresetKind.LIT;
      this._entry = "";
      this._presetAmount = 0;
      return;
    }

    const digits = ButtonIds.digitString(id);
    if (digits !== null) {
      if (this._state === "SETTING_PRICE" || this._state === "PRESETTING_COST") {
        this._entry = (this._entry + digits).slice(0, 8);
        this._presetAmount = this._state === "PRESETTING_COST" ? Number(this._entry) || 0 : this._presetAmount;
      } else if (this._state === "PRESETTING_LIT") {
        this._entry = (this._entry + digits).slice(0, 6);
        this._presetAmount = Number(this._entry) / 1000; // keypad enters milli-litres
      }
      return;
    }

    if (id === ButtonId.E) {
      if (this._state === "SETTING_PRICE" && this._entry.length > 0) {
        this._unitPrice = Number(this._entry) || this._unitPrice;
        this.events.notify({
          type: "preset-entered",
          kind: PresetKind.SET_PRICE,
          value: String(this._unitPrice),
          timestampMs: this._clock.now(),
        });
        this._state = "IDLE";
        this._entry = "";
      }
    }
  }

  private _presetValueString(): string {
    if (this._presetKind === PresetKind.LIT) return this._presetAmount.toFixed(3);
    return String(Math.round(this._presetAmount));
  }

  private _targetVolume(): number | null {
    if (this._presetKind === PresetKind.LIT && this._presetAmount > 0) {
      return this._presetAmount;
    }
    if (this._presetKind === PresetKind.COST && this._presetAmount > 0) {
      return this._presetAmount / this._unitPrice;
    }
    return null;
  }

  private _renderScreen(): string {
    switch (this._state) {
      case "ERROR":
        return "E 08";
      case "SETTING_PRICE":
        return `6IA ${this._entry}`;
      case "PRESETTING_COST":
        return `t ${this._entry || "0"}`;
      case "PRESETTING_LIT":
        return `L ${(Number(this._entry) / 1000 || 0).toFixed(3)}`;
      case "PUMPING": {
        const cost = String(Math.round(this._pumpedCost)).padStart(7, " ");
        const vol = this._pumpedVolume.toFixed(2).padStart(7, " ");
        return `${cost}L${vol}`.slice(0, 16);
      }
      case "IDLE":
      default:
        return "L  0.000";
    }
  }

  private _emitScreenIfChanged(): void {
    const next = this._renderScreen();
    if (next === this._lastScreen) return;
    this._lastScreen = next;
    this.events.notify({ type: "screen-changed", text: ScreenText.of(next) });
  }
}
