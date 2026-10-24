import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IReportDetectorStateMsg } from "@/ipc-shared/IReportDetectorStateMsg";
import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { keyboard } from "../index";

/**
 * §17 (nội bộ) Report Detector State → panel trạng thái máy phát hiện trên giao diện. Adapter mỏng.
 */
class DetectorStateController
  extends IPCControllerBaseV2<void, IReportDetectorStateMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("DetectorStateController");

  constructor() {
    super();
    DeviceServiceGateway.getInstance().subscribe(this);
  }

  channel(): string {
    return "keyboard-detector-state";
  }

  update(data: IEventMsg): void {
    const report = keyboard.detectorState.apply(data);
    if (report) this.sendMsgToTargetWindow(report);
  }
}

export const detectorStateController = new DetectorStateController();
