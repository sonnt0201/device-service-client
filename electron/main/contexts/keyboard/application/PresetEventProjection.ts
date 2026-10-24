import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IReportPresetMsg } from "@/ipc-shared/IReportPresetMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";

/**
 * §1 Preset event — thiết bị báo một lần bơm theo preset đã diễn ra. Đưa thẳng lên giao
 * diện (bảng hoá đơn). Chỉ chuẩn hoá, không giữ trạng thái.
 */
export class PresetEventProjection {
  private readonly _logger: IMainLogger = new MainLogger("PresetEventProjection");

  apply(data: IEventMsg): IReportPresetMsg | undefined {
    if (data.content.message_type !== MsgTypeValue.PRESET) return undefined;

    const rawMessage = data.content as Partial<IReportPresetMsg>;

    if (!rawMessage.device_id || !Number.isFinite(rawMessage.timestamp)) {
      this._logger.warn(`Malformed preset report: ${JSON.stringify(data.content)}`);
      return undefined;
    }

    return {
      message_id: String(rawMessage.message_id ?? data.id),
      message_type: MsgTypeValue.PRESET,
      device_id: String(rawMessage.device_id),
      timestamp: Number(rawMessage.timestamp),
      pre_cost: Number(rawMessage.pre_cost ?? 0),
      pre_volume: Number(rawMessage.pre_volume ?? 0),
      pre_price: Number(rawMessage.pre_price ?? 0),
    };
  }
}
