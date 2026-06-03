import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

/**
 * Json format for Report Preset received from Device Service.
 */
export interface IReportPresetMsg extends IHasMsgType {
  message_id: string;
  message_type: MsgTypeValue.PRESET;
  device_id: string;
  timestamp: number;
  pre_cost: number;
  pre_volume: number;
  pre_price: number;
}
