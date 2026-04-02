import { Observable } from "../base/Observable";

export type TcpDirection = "send" | "recv";

export interface ITcpRawLog {
  direction: TcpDirection;
  source: "event" | "realtime";
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
