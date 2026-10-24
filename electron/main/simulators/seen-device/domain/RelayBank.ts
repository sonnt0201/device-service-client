/**
 * The device's relay outputs.
 *
 * SEEN has `N_RELAY = 2` (`../LogiProj_DeviceV2/App/GlobalConfig.h`). Reported to
 * Device Service via `CMD 0x03` — as the handshake time-sync reply and whenever
 * `CMD 0x04` sets a state.
 */
export class RelayBank {
  static readonly COUNT = 2;

  private readonly _states: number[] = new Array(RelayBank.COUNT).fill(0);

  set(id: number, state: number): void {
    if (id < 0 || id >= RelayBank.COUNT) return;
    this._states[id] = state ? 1 : 0;
  }

  /** Apply the raw payload of `CMD 0x04` (one byte per relay). */
  applyWire(payload: readonly number[]): void {
    for (let i = 0; i < RelayBank.COUNT && i < payload.length; i++) {
      this._states[i] = payload[i] ? 1 : 0;
    }
  }

  snapshot(): number[] {
    return [...this._states];
  }
}
