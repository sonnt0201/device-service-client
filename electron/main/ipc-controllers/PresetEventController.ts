import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import { IReportPresetMsg } from "../../../src/ipc-shared/IReportPresetMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { IObserver } from "../base/IObserver";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";

class PresetEventController
  extends IPCControllerBaseV2<void, IReportPresetMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("PresetEventController");

  private _eventExchangeDSListener = EventExchangeDSListener.getInstance();

  constructor() {
    super();
    this._eventExchangeDSListener.eventMsgNotifier.subcribe(this);
  }

  channel(): string {
    return "logi-preset-event";
  }

  update(data: IEventMsg): void {
    if (data.content.message_type !== MsgTypeValue.PRESET) return;

    const rawMessage = data.content as Partial<IReportPresetMsg>;

    if (!rawMessage.device_id || !Number.isFinite(rawMessage.timestamp)) {
      this._logger?.warn(`Malformed preset report: ${JSON.stringify(data.content)}`);
      return;
    }

    const normalized: IReportPresetMsg = {
      message_id: String(rawMessage.message_id ?? data.id),
      message_type: MsgTypeValue.PRESET,
      device_id: String(rawMessage.device_id),
      timestamp: Number(rawMessage.timestamp),
      pre_cost: Number(rawMessage.pre_cost ?? 0),
      pre_volume: Number(rawMessage.pre_volume ?? 0),
      pre_price: Number(rawMessage.pre_price ?? 0),
    };

    this.sendMsgToTargetWindow(normalized);
  }
}

export const presetEventController = new PresetEventController();
