import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

//* ============ PatchPlan 26-8-11 ========
/**
 * Json format for §16 Stop bump sent to Device Service.
 *
 * Không payload ngoài device_id: cách thiết bị thực sự dừng bơm là quyết định
 * của device-type ở tầng dưới (Device Service / firmware), không phải của Logi.
 */
export interface IStopBumpMsg extends IHasMsgType {
  message_id: string;
  message_type: MsgTypeValue.STOP_BUMP;
  device_id: string;
}
// * =========== End PatchPlan 26-8-11  ========
