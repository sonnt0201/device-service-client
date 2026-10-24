import { IObserver } from "../../../../shared/events/IObserver";
import { SeenDomainEvent } from "../../domain/events";
import { VirtualJobEvent } from "../../domain/events";
import { DeviceFrames } from "../../infrastructure/DeviceFrames";
import { Cmd, StatusCode } from "../../infrastructure/protocol";
import { ISimRuntime } from "../ISimRuntime";
import { rejectionToStatus } from "../statusMapping";

/**
 * Turns domain events into `Device -> DS` frames. One projection per outbound
 * CMD, mirroring `contexts/keyboard/application/*Projection.ts`. No machine
 * rules — the dispenser already decided what happened.
 */
export class OutboundEmitters implements IObserver<SeenDomainEvent> {
  constructor(private readonly _rt: ISimRuntime) {
    _rt.dispenser.events.subcribe(this);
    _rt.job.events.subcribe({ update: (e) => this._onJobEvent(e) });
  }

  update(event: SeenDomainEvent): void {
    switch (event.type) {
      case "screen-changed":
        this._rt.link.send(
          Cmd.KEYBOARD_STREAM_KBSCREEN,
          DeviceFrames.streamKeyboardScreen([
            { timestampBytes: this._rt.clock.nowBytes(), text: event.text.content },
          ]),
        );
        break;

      case "buttons-pressed":
        if (event.ids.length === 0) break;
        this._rt.link.send(
          Cmd.KEYBOARD_REPORT_BUTTONS_PRESSED,
          DeviceFrames.reportButtons([
            { timestampBytes: this._toBytes(event.timestampMs), ids: event.ids },
          ]),
        );
        break;

      case "preset-entered":
        this._rt.link.send(
          Cmd.KEYBOARD_REPORT_USER_OPERATION,
          DeviceFrames.reportUserOperation(
            event.kind,
            this._toBytes(event.timestampMs),
            event.value,
          ),
        );
        break;

      // pump-started / pump-progressed / sale-completed drive the column screen
      // (CMD 0x02) — phase 2. sale bills come from the DS Logger decoding that.
      default:
        break;
    }
  }

  private _onJobEvent(event: VirtualJobEvent): void {
    if (event.type === "button-emitted") return; // routed to the dispenser elsewhere

    if (event.type === "completed") {
      this._rt.link.send(Cmd.KEYBOARD_COMMON_STATUS_CODE, DeviceFrames.status(StatusCode.KEYBOARD_DONE));
      return;
    }

    const { code, meta } = rejectionToStatus(event.reason);
    this._rt.link.send(Cmd.KEYBOARD_COMMON_STATUS_CODE, DeviceFrames.status(code, meta));
  }

  private _toBytes(epochMs: number): number[] {
    const ts = BigInt(Math.floor(epochMs));
    const out: number[] = [];
    for (let i = 7; i >= 0; i--) out.push(Number((ts >> BigInt(8 * i)) & 0xffn));
    return out;
  }
}
