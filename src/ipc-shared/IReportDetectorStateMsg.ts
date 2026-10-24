import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

/**
 * Nội bộ, không public (LogiAPI §17, DeviceAPI CMD 0x19).
 *
 * State hiện tại của 3 máy phát hiện trên thiết bị bàn phím. Device Service gửi khi thiết bị vừa kết nối
 * và mỗi khi state của bất kỳ máy nào đổi.
 */
export type PresetDetectorState = "IDLING_PRESET" | "PRESET";
export type PumpLogDetectorState = "IDLING_LOG" | "PUMPING";
export type PriceSetDetectorState = "IDLING_PRICE" | "SET_PRICE";

export interface IReportDetectorStateMsg extends IHasMsgType {
  message_id: string;
  message_type: MsgTypeValue.REPORT_DETECTOR_STATE;
  device_id: string;
  timestamp: number;
  preset_state: PresetDetectorState;
  /** Chỉ có nghĩa khi preset_state = "PRESET": true = Confident Yes */
  preset_confident: boolean;
  pump_state: PumpLogDetectorState;
  price_state: PriceSetDetectorState;
}
