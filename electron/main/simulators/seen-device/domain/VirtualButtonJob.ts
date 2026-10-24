import { Observable } from "../../../shared/events/Observable";
import { RELEASE_BUTTON } from "./values/ButtonId";
import { JobRejection, VirtualJobEvent } from "./events";

/**
 * Non-blocking virtual keypress scheduler.
 *
 * Ports `../LogiProj_DeviceV2/App/Control/Keyboard/UserOperationService_Seen.c`:
 * one job at a time (a second `enqueue` while running is `BUSY`), one step every
 * `PRESS_INTERVAL`, each requested button expanded to a press then a release.
 * Terminal outcome is emitted after the last step, optionally gated by a
 * caller-supplied screen check (`_validateCompletedJob`).
 *
 * Transport-free: it emits `button-emitted` and the owner decides how the key
 * reaches the machine and the wire.
 */
export const PRESS_INTERVAL_MS = 500;
const MAX_BUTTONS = 100;

interface JobOptions {
  /** Run at completion; `false` -> `failed(EXECUTION_ERROR)` (preset verify). */
  validate?: () => boolean;
}

export class VirtualButtonJob {
  readonly events = new Observable<VirtualJobEvent>();

  private _sequence: number[] = [];
  private _next = 0;
  private _nextTickAt = 0;
  private _running = false;
  private _validate?: () => boolean;

  get isRunning(): boolean {
    return this._running;
  }

  /**
   * @returns `JobRejection.NONE` when accepted, otherwise why it was refused.
   */
  enqueue(buttons: number[], now: number, opts: JobOptions = {}): JobRejection {
    if (this._running) return JobRejection.BUSY;

    if (buttons.length === 0) {
      // firmware: Count 0 -> just release, succeeds immediately
      this.events.notify({ type: "button-emitted", id: RELEASE_BUTTON });
      return JobRejection.NONE;
    }

    if (buttons.length > MAX_BUTTONS) return JobRejection.INVALID_ARG;

    this._sequence = [];
    for (const b of buttons) {
      this._sequence.push(b);
      if (b !== RELEASE_BUTTON) this._sequence.push(RELEASE_BUTTON);
    }
    this._next = 0;
    this._nextTickAt = now + PRESS_INTERVAL_MS;
    this._validate = opts.validate;
    this._running = true;
    return JobRejection.NONE;
  }

  /** Drive from the simulator loop; safe to call every frame. */
  advance(now: number): void {
    if (!this._running || now < this._nextTickAt) return;

    if (this._next >= this._sequence.length) {
      this._finish();
      return;
    }

    this.events.notify({ type: "button-emitted", id: this._sequence[this._next] });
    this._next += 1;
    this._nextTickAt = now + PRESS_INTERVAL_MS;
  }

  private _finish(): void {
    const ok = this._validate ? this._validate() : true;
    this._running = false;
    this._sequence = [];
    this._next = 0;
    this._validate = undefined;
    this.events.notify(
      ok ? { type: "completed" } : { type: "failed", reason: JobRejection.EXECUTION_ERROR },
    );
  }
}
