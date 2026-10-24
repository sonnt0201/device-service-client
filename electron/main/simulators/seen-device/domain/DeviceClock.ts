/**
 * Device wall clock.
 *
 * Ports `../LogiProj_DeviceV2/App/Control/Timestamp/TimeService.c`: the board has
 * only a monotonic tick until Device Service sends `CMD 0x05` with an epoch-ms
 * value; from then on `now()` is `monotonic + offset`.
 *
 * The simulator runs on a real OS clock, so it is already time-synced; `syncTo`
 * still records the offset the way the firmware would, and every outbound frame
 * is stamped through here.
 */
export class DeviceClock {
  private _offsetMs = 0;
  private _synced = false;

  syncTo(epochMs: number): void {
    if (!Number.isFinite(epochMs) || epochMs <= 0) return;
    this._offsetMs = epochMs - Date.now();
    this._synced = true;
  }

  now(): number {
    return Date.now() + this._offsetMs;
  }

  get isSynced(): boolean {
    return this._synced;
  }

  /** 8 bytes, MSB -> LSB — the timestamp layout used by every keyboard frame. */
  nowBytes(): number[] {
    const ts = BigInt(Math.floor(this.now()));
    const out: number[] = [];
    for (let i = 7; i >= 0; i--) {
      out.push(Number((ts >> BigInt(8 * i)) & 0xffn));
    }
    return out;
  }
}
