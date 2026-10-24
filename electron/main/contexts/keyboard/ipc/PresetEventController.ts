import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IReportPresetMsg } from "@/ipc-shared/IReportPresetMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

/**
 * §1 Preset event → bảng hoá đơn trên giao diện. Adapter mỏng.
 */
class PresetEventController
  extends IPCControllerBaseV2<void, IReportPresetMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("PresetEventController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "logi-preset-event";
  }

  update(data: IEventMsg): void {
    const report = keyboard.presetEvents.apply(data);
    if (report) this.sendMsgToTargetWindow(report);
  }
}

export const presetEventController = new PresetEventController();
