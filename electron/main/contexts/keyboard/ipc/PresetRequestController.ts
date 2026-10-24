import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IKeyboardPresetStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { ISetPresetMsg } from "@/ipc-shared/ISetPresetMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

/**
 * §15 Bán theo Preset. Adapter mỏng: hình dạng phản hồi `{status, meta}` và luật tối đa
 * 2 phản hồi/yêu cầu nằm trong {@link keyboard.requestPreset}.
 */
class PresetRequestController
  extends IPCControllerBaseV2<ISetPresetMsg, IKeyboardPresetStatusMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("PresetRequestController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "preset-request";
  }

  on(_event: Electron.IpcMainEvent, message: ISetPresetMsg): void {
    keyboard.requestPreset.execute(message);
  }

  update(data: IEventMsg): void {
    const status = keyboard.requestPreset.resolveResponse(data);
    if (status) this.sendMsgToTargetWindow(status);
  }
}

export const presetRequestController = new PresetRequestController();
