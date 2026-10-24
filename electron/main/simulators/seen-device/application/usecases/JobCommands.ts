import { JobRejection } from "../../domain/events";
import { ButtonId, RELEASE_BUTTON } from "../../domain/values/ButtonId";
import { PresetKind } from "../../domain/values/PresetKind";
import { PresetValue } from "../../domain/values/PresetValue";
import { DeviceFrames } from "../../infrastructure/DeviceFrames";
import { Cmd, RxFrame, StatusCode } from "../../infrastructure/protocol";
import { ISimRuntime } from "../ISimRuntime";
import { rejectionToStatus } from "../statusMapping";

/**
 * Base for the three `DS -> Device` commands that create a virtual keypress job
 * (`CMD 0x14` press buttons, `CMD 0x16` request user operation, `CMD 0x18` stop
 * pumping). Each sends the immediate `CMD 0x15` phase-1 status here; the phase-2
 * terminal status comes later from {@link OutboundEmitters} on the job event.
 *
 * Mirrors `KeyboardController_HandlePressVirtualButtons` /
 * `_HandleRequestToCreateUserOperation` / `_HandleStopPumping`.
 */
abstract class JobCommand {
  constructor(protected readonly rt: ISimRuntime) {}

  protected abstract requiresVirtualMode: boolean;

  /** Build the button list, or reject before a job is created. */
  protected abstract plan(frame: RxFrame):
    | { buttons: number[]; validate?: () => boolean }
    | { reject: JobRejection; meta?: string };

  handle(frame: RxFrame): void {
    if (this.requiresVirtualMode && this.rt.currentMode().isPhysical) {
      this._reply(JobRejection.WRONG_MODE);
      return;
    }

    const planned = this.plan(frame);
    if ("reject" in planned) {
      this._reply(planned.reject, planned.meta);
      return;
    }

    const outcome = this.rt.job.enqueue(planned.buttons, this.rt.clock.now(), {
      validate: planned.validate,
    });

    if (outcome !== JobRejection.NONE) {
      this._reply(outcome);
      return;
    }

    // accepted
    this.rt.link.send(
      Cmd.KEYBOARD_COMMON_STATUS_CODE,
      DeviceFrames.status(StatusCode.KEYBOARD_RECEIVED),
    );

    // empty operation completes instantly (firmware returns RC_SUCCESS at once)
    if (!this.rt.job.isRunning) {
      this.rt.link.send(
        Cmd.KEYBOARD_COMMON_STATUS_CODE,
        DeviceFrames.status(StatusCode.KEYBOARD_DONE),
      );
    }
  }

  private _reply(reason: JobRejection, meta?: string): void {
    const mapped = rejectionToStatus(reason);
    this.rt.link.send(
      Cmd.KEYBOARD_COMMON_STATUS_CODE,
      DeviceFrames.status(mapped.code, meta ?? mapped.meta),
    );
  }
}

/** `CMD 0x14` — explicit button list. */
export class PressVirtualButtons extends JobCommand {
  protected requiresVirtualMode = true;

  protected plan(frame: RxFrame) {
    const ids = frame.payload;
    if (ids.length === 0 || ids.length > 100) {
      return { reject: JobRejection.INVALID_ARG, meta: "Error: Invalid button list." };
    }
    return { buttons: [...ids] };
  }
}

/** `CMD 0x16` — semantic preset, expanded to a button sequence here. */
export class RequestUserOperation extends JobCommand {
  protected requiresVirtualMode = true;

  protected plan(frame: RxFrame) {
    const body = frame.payload;
    if (body.length < 2) {
      return { reject: JobRejection.INVALID_ARG, meta: "Error: Empty preset value." };
    }

    const kind = body[0] as PresetKind;
    if (kind !== PresetKind.COST && kind !== PresetKind.LIT) {
      return { reject: JobRejection.INVALID_ARG, meta: "Error: Wrong preset type value." };
    }

    const raw = this._readCString(body.slice(1));
    if (raw.length > 16) {
      return { reject: JobRejection.INVALID_ARG, meta: "Error: value too big." };
    }

    if (this.rt.dispenser.state === "PUMPING") {
      return { reject: JobRejection.BUSY, meta: "Busy: Machine is on pumping." };
    }
    if (this.rt.dispenser.state === "ERROR") {
      return { reject: JobRejection.BUSY, meta: "Busy: Machine is on error." };
    }

    let preset: PresetValue;
    try {
      preset = PresetValue.parse(kind, raw);
    } catch (err) {
      return { reject: JobRejection.INVALID_ARG, meta: (err as Error).message };
    }

    const expectedDigits = preset.text.split(".").join("");
    return {
      buttons: preset.toButtonSequence(),
      validate: () => this.rt.dispenser.screenShowsNumber(expectedDigits),
    };
  }

  private _readCString(bytes: number[]): string {
    const nul = bytes.indexOf(0);
    const end = nul === -1 ? bytes.length : nul;
    return String.fromCharCode(...bytes.slice(0, end));
  }
}

/**
 * `CMD 0x18` — stop pumping. On SEEN: press virtual `0` twice
 * (`UserOperationService_Virtual_StopPumping`). Not blocked by `STATE_PUMPING`.
 */
export class StopPumping extends JobCommand {
  protected requiresVirtualMode = true;

  protected plan() {
    return {
      buttons: [ButtonId.N0, ButtonId.N0, RELEASE_BUTTON as unknown as ButtonId],
    };
  }
}
