import { KeyboardMode, MsgTypeValue } from "./MessageType";

/**
 * Device entry from Device Service message_type = 8.
 */
export interface IDeviceServiceDevice {
  connection_state: boolean;
  device_id: string;
  device_type: number;
  firm_version: number;
  message_id: string;
  message_type: MsgTypeValue.GET_DEVICES;
  updated_at: number;

  //* ============ PatchPlan 26-7-21 ========
  /**
   * D4: trạng thái thiết bị có thêm chế độ bàn phím.
   *
   * Q1: CHỈ thiết bị bàn phím mới có trường này. Thiết bị màn hình không bao giờ báo
   * mode nên Device Service BỎ QUA trường luôn (thay vì gửi một giá trị mặc định —
   * "manu" mặc định sẽ bị đọc nhầm là câu trả lời thật). Vì vậy: optional.
   */
  mode?: KeyboardMode;
  // * =========== End PatchPlan 26-7-21  ========
}
