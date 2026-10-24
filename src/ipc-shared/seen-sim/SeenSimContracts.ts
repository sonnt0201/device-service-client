/**
 * IPC contracts for the SEEN device-simulator window (renderer <-> main).
 *
 * This is NOT the binary device wire protocol (that lives in
 * `electron/main/simulators/seen-device/infrastructure`). It is only the small
 * set of messages the simulator's own UI exchanges with the main process over
 * the `seen-device-sim` channel.
 */

export type SeenSimLinkState = "idle" | "connecting" | "connected";

export type SeenSimDispenserState =
  | "IDLE"
  | "PRESETTING_COST"
  | "PRESETTING_LIT"
  | "SETTING_PRICE"
  | "PUMPING"
  | "ERROR";

export type SeenSimNozzle = "seated" | "lifted";

/** Full state of the simulator, pushed to the window after any change. */
export interface ISeenSimSnapshot {
  link: SeenSimLinkState;
  linkDetail?: string;
  mac: string;
  host: string;
  port: number;
  /** True while listening for the Device Service UDP discovery beacon. */
  discovering: boolean;
  /** `host:port` of the last beacon seen (for display). */
  discoverySource?: string;
  /** Whether the link to Device Service uses TLS (the real firmware always does). */
  tls: boolean;
  /** CPLD mux position — `physical` keys work only in this mode. */
  mode: "physical" | "virtual";
  state: SeenSimDispenserState;
  nozzle: SeenSimNozzle;
  unitPrice: number;
  presetKind: number;
  presetAmount: number;
  pumpedCost: number;
  pumpedVolume: number;
  screenText: string;
  clockSynced: boolean;
  relays: number[];
  jobRunning: boolean;
}

export type SeenSimCommand =
  | { kind: "connect"; mac: string; host: string; port: number; tls?: boolean }
  | { kind: "disconnect" }
  | { kind: "discover"; mac: string; tls?: boolean }
  | { kind: "stop-discovery" }
  | { kind: "press-key"; buttonId: number }
  | { kind: "nozzle"; action: "lift" | "seat" }
  | { kind: "set-unit-price"; vnd: number }
  | { kind: "set-flow"; litrePerSecond: number }
  | { kind: "factory-reset" }
  | { kind: "raise-error" }
  | { kind: "clear-error" };

export const SEEN_SIM_CHANNEL = "seen-device-sim";

/** IPC channel carrying one structured frame per device <-> Device Service packet. */
export const SEEN_SIM_FRAME_CHANNEL = "seen-device-sim-frame";

/**
 * One framed packet on the simulator's link to Device Service, structured for
 * the log window and the packet inspector (as opposed to the pre-formatted
 * string on `seen-device-sim-log`).
 */
export interface ISeenSimFrameLog {
  /** Monotonic id, stable key for the UI. */
  seq: number;
  /** Epoch milliseconds when the frame was sent / received. */
  at: number;
  direction: "send" | "recv";
  /** `CMD` byte. */
  cmd: number;
  /** `Cmd[cmd]` name, or `"UNKNOWN"`. */
  cmdName: string;
  /** Whole frame (header + payload) as lowercase hex, no separators. */
  bytesHex: string;
  /** Header length in bytes (always 12). */
  headerLen: number;
  /** Payload length in bytes (`bytesHex` length / 2 - headerLen). */
  payloadLen: number;
}
