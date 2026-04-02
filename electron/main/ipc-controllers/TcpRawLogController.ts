import { IObserver } from "../base/IObserver";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { ITcpRawLog, TcpRawLogBus } from "../models/TcpRawLogBus";
import { IEventMsg } from "@/ipc-shared/IEventMsg";

class TcpRawLogController extends IPCControllerBaseV2<never, ITcpRawLog>
  implements IObserver<ITcpRawLog> {

  _logger: IMainLogger | undefined = new MainLogger("TcpRawLogController");

  private _bus: TcpRawLogBus = TcpRawLogBus.getInstance();

  constructor() {
    super();
    this._bus.subcribe(this);
  }

  channel(): string {
    return "tcp-raw-log";
  }

  // We don't expect any incoming messages from renderer
  // so we don't implement on/handle.

  update(data: ITcpRawLog): void {
    // forward to bound window
    this.sendMsgToTargetWindow(data);
  }
}

export const tcpRawLogController = new TcpRawLogController();
