import { Observable } from "../../shared/events/Observable";

export type TcpDirection = "send" | "recv";

/**
 * `event` / `realtime` — the two Logi-side DS listeners (ports 5002 / 5001).
 * `device` — the SEEN device simulator's link to Device Service (port 5000).
 */
export type TcpRawLogSource = "event" | "realtime" | "device";

export interface ITcpRawLog {
  direction: TcpDirection;
  source: TcpRawLogSource;
  payload: string;
}

/**
 * Global singleton bus for raw TCP messages so multiple DS listeners
 * can publish logs and IPC controllers can subscribe.
 */
export class TcpRawLogBus extends Observable<ITcpRawLog> {
  private static _instance: TcpRawLogBus;

  private constructor() {
    super();
  }

  public static getInstance(): TcpRawLogBus {
    if (!TcpRawLogBus._instance) {
      TcpRawLogBus._instance = new TcpRawLogBus();
    }
    return TcpRawLogBus._instance;
  }
}
