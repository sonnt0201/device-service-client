import { KeyboardMode } from "../../domain/values/KeyboardMode";
import { DeviceFrames } from "../../infrastructure/DeviceFrames";
import { Cmd, RxFrame } from "../../infrastructure/protocol";
import { ISimRuntime } from "../ISimRuntime";

/**
 * `DS -> Device` system commands with trivial bodies. One class, one method per
 * CMD, mirroring `TimeSyncController` / `RelayController` /
 * `KeyboardController_HandleRequestToSetMode`.
 */
export class SystemCommands {
  constructor(private readonly _rt: ISimRuntime) {}

  /** `CMD 0x05`: adopt the epoch-ms clock, then reply `CMD 0x03` relay report. */
  handleTimeSync(frame: RxFrame): void {
    if (frame.payload.length >= 8) {
      let ts = 0n;
      for (let i = 0; i < 8; i++) ts = (ts << 8n) | BigInt(frame.payload[i] & 0xff);
      this._rt.clock.syncTo(Number(ts));
    }
    this._replyRelays();
  }

  /** `CMD 0x06`: echo it straight back. */
  handlePing(): void {
    this._rt.link.send(Cmd.KEEP_ALIVE, DeviceFrames.keepAlive());
  }

  /** `CMD 0x04`: apply relay states, reply `CMD 0x03`. */
  handleSetRelay(frame: RxFrame): void {
    this._rt.relays.applyWire(frame.payload);
    this._replyRelays();
  }

  /** `CMD 0x10`: flip the mux, reply `CMD 0x11` with the effective mode. */
  handleSetMode(frame: RxFrame): void {
    if (frame.payload.length >= 1) {
      this._rt.applyMode(KeyboardMode.fromWireByte(frame.payload[0]));
    }
    this._rt.link.send(
      Cmd.KEYBOARD_REPORT_MODE,
      DeviceFrames.reportMode(this._rt.currentMode().wireByte),
    );
  }

  private _replyRelays(): void {
    this._rt.link.send(Cmd.RELAY_REPORT, DeviceFrames.reportRelays(this._rt.relays.snapshot()));
  }
}
