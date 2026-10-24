import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IKeyboardStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { IStopBumpMsg } from "@/ipc-shared/IStopBumpMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

/**
 * §16 Dừng bơm (LogiAPI 11-08-2026). Cùng hình dạng phản hồi số học như §12.
 */
class StopBumpController
  extends IPCControllerBaseV2<IStopBumpMsg, IKeyboardStatusMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("StopBumpController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "stop-bump";
  }

  on(_event: Electron.IpcMainEvent, message: IStopBumpMsg): void {
    keyboard.stopBump.execute(message);
  }

  update(data: IEventMsg): void {
    const status = keyboard.stopBump.resolveResponse(data);
    if (status) this.sendMsgToTargetWindow(status);
  }
}

export const stopBumpController = new StopBumpController();
