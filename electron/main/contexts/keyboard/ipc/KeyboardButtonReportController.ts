import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IReportKeyboardButtonsPressedMsg } from "@/ipc-shared/IReportKeyboardButtonsPressedMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

/**
 * §13 Report Buttons Pressed. Adapter mỏng: chuẩn hoá nằm trong projection.
 */
class KeyboardButtonReportController
  extends IPCControllerBaseV2<void, IReportKeyboardButtonsPressedMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("KeyboardButtonReportController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "keyboard-buttons-pressed";
  }

  update(data: IEventMsg): void {
    const report = keyboard.buttonsPressed.apply(data);
    if (report) this.sendMsgToTargetWindow(report);
  }
}

export const keyboardButtonReportController = new KeyboardButtonReportController();
