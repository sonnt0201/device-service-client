import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

/**
 * Json format for Request Preset sent to Device Service.
 */
export interface ISetPresetMsg extends IHasMsgType {
  message_id: string;
  message_type: MsgTypeValue.REQUEST_PRESET;
  device_id: string;
  pre_cost?: number;
  pre_volume?: number;
}
