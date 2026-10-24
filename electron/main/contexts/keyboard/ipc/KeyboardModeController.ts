import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IReportKeyboardModeMsg } from "@/ipc-shared/IReportKeyboardModeMsg";
import { ISetKeyboardModeMsg } from "@/ipc-shared/ISetKeyboardModeMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

type KeyboardModeQuery = { device_id?: string } | undefined;

/**
 * §9/§10/§11 Chế độ bàn phím. Adapter mỏng: chuyển IPC ↔ use-case, không chứa quy tắc.
 */
class KeyboardModeController
  extends IPCControllerBaseV2<ISetKeyboardModeMsg, IReportKeyboardModeMsg | undefined>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("KeyboardModeController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "keyboard-mode";
  }

  on(_event: Electron.IpcMainEvent, message: ISetKeyboardModeMsg): void {
    keyboard.setMode.execute(message);
  }

  async handle(
    _event: Electron.IpcMainInvokeEvent,
    query: KeyboardModeQuery
  ): Promise<IReportKeyboardModeMsg | undefined> {
    return keyboard.modeProjection.getMode(query?.device_id);
  }

  update(data: IEventMsg): void {
    // Phản hồi số học của §10 được tiêu thụ ở use-case; chỉ đi tiếp nếu không phải.
    if (keyboard.setMode.handleResponse(data)) return;

    const report = keyboard.modeProjection.applyReport(data);
    if (report) this.sendMsgToTargetWindow(report);
  }
}

export const keyboardModeController = new KeyboardModeController();
