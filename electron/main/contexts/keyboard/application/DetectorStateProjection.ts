import { IEventMsg } from "@/ipc-shared/IEventMsg";
import {
  IReportDetectorStateMsg,
  PresetDetectorState,
  PriceSetDetectorState,
  PumpLogDetectorState,
} from "@/ipc-shared/IReportDetectorStateMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";

const PRESET_STATES: readonly PresetDetectorState[] = ["IDLING_PRESET", "PRESET"];
const PUMP_STATES: readonly PumpLogDetectorState[] = ["IDLING_LOG", "PUMPING"];
const PRICE_STATES: readonly PriceSetDetectorState[] = ["IDLING_PRICE", "SET_PRICE"];

/**
 * §17 (nội bộ) Report Detector State: thiết bị báo state hiện tại của 3 máy phát hiện.
 * Chỉ kiểm tra và chuẩn hoá, không giữ trạng thái (giao diện giữ state mới nhất của từng thiết bị).
 */
export class DetectorStateProjection {
  private readonly _logger: IMainLogger = new MainLogger("DetectorStateProjection");

  apply(data: IEventMsg): IReportDetectorStateMsg | undefined {
    if (data.content.message_type !== MsgTypeValue.REPORT_DETECTOR_STATE) return undefined;

    const raw = data.content as Partial<IReportDetectorStateMsg>;

    if (
      !raw.device_id ||
      !Number.isFinite(raw.timestamp) ||
      !PRESET_STATES.includes(raw.preset_state as PresetDetectorState) ||
      !PUMP_STATES.includes(raw.pump_state as PumpLogDetectorState) ||
      !PRICE_STATES.includes(raw.price_state as PriceSetDetectorState)
    ) {
      this._logger.warn(`Malformed detector state report: ${JSON.stringify(data.content)}`);
      return undefined;
    }

    return {
      message_id: String(raw.message_id ?? data.id),
      message_type: MsgTypeValue.REPORT_DETECTOR_STATE,
      device_id: String(raw.device_id),
      timestamp: Number(raw.timestamp),
      preset_state: raw.preset_state as PresetDetectorState,
      preset_confident: raw.preset_confident === true,
      pump_state: raw.pump_state as PumpLogDetectorState,
      price_state: raw.price_state as PriceSetDetectorState,
    };
  }
}
