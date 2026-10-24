import { KeyboardStatusCode, PresetStatusValue } from "./MessageType";

//* ============ PatchPlan 26-7-21 ========
/**
 * Phản hồi cuối cùng (terminal) cho các yêu cầu bàn phím dạng số: §10 đặt chế độ,
 * §12 nhấn phím ảo, §16 dừng bơm.
 *
 * Thay cho `{message_id, status, meta}` cũ (D5/D6/D9):
 * - không còn ack trung gian `status: "received"` — mỗi yêu cầu chỉ có ĐÚNG 1 phản hồi;
 * - `status` (chuỗi) -> `status_code` (số), `meta` -> `error_message`.
 *
 * Lưu ý: Device Service KHÔNG gửi kèm `device_id` trong phản hồi này. Bên main process
 * phải tự tra `message_id` trong bảng yêu cầu đang chờ để biết nó thuộc thiết bị nào —
 * xem `KeyboardRequestRegistry`.
 *
 * §15 Bán theo Preset KHÔNG dùng type này nữa từ 11-08-2026 - xem `IKeyboardPresetStatusMsg`.
 */
export interface IKeyboardStatusMsg {
  message_id: string;
  status_code: KeyboardStatusCode;
  error_message?: string;

  /** Do main process điền thêm từ bảng yêu cầu đang chờ, không đến từ dây */
  device_id?: string;
}

/**
 * Tên cũ, giữ lại để không phải sửa hết chỗ import.
 */
export type IPresetStatusMsg = IKeyboardStatusMsg;
// * =========== End PatchPlan 26-7-21  ========

//* ============ PatchPlan 26-8-11 ========
/**
 * Phản hồi của §15 Bán theo Preset (LogiAPI 11-08-2026) - hình dạng RIÊNG, KHÔNG
 * còn `status_code`/`log_info` như trước D5/D6. Một yêu cầu có thể sinh TỐI ĐA 2
 * gói tin loại này: "received" trước, rồi "busy" | "done" | "error" - hoặc chỉ
 * một mình "busy" nếu Device Service từ chối ngay (không có phản hồi thứ 2).
 */
export interface IKeyboardPresetStatusMsg {
  message_id: string;
  status: PresetStatusValue;
  meta?: string;

  /** Do main process điền thêm từ bảng yêu cầu đang chờ, không đến từ dây */
  device_id?: string;
}
// * =========== End PatchPlan 26-8-11  ========
