import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IKeyboardButtonPressMsg } from "@/ipc-shared/IKeyboardButtonPressMsg";
import { IKeyboardStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

/**
 * §12 Nhấn phím ảo. Adapter mỏng: gửi lệnh xuống use-case, đẩy phản hồi cuối cùng
 * (D6 — mọi yêu cầu từ Logi đều có phản hồi) lên giao diện.
 */
class KeyboardVirtualButtonController
  extends IPCControllerBaseV2<IKeyboardButtonPressMsg, IKeyboardStatusMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("KeyboardVirtualButtonController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "keyboard-press-virtual-buttons";
  }

  on(_event: Electron.IpcMainEvent, message: IKeyboardButtonPressMsg): void {
    keyboard.pressButtons.execute(message);
  }

  update(data: IEventMsg): void {
    const status = keyboard.pressButtons.resolveResponse(data);
    if (status) this.sendMsgToTargetWindow(status);
  }
}

export const keyboardVirtualButtonController = new KeyboardVirtualButtonController();
