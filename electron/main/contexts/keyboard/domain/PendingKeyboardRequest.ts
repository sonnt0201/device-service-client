/**
 * Một yêu cầu bàn phím đã gửi đi và đang chờ phản hồi terminal từ Device Service.
 *
 * VÌ SAO CẦN: từ LogiAPI 21-07-2026 (D5/D6/D9), phản hồi cuối cùng của §10 đặt chế độ,
 * §12 nhấn phím ảo, §16 dừng bơm đều có cùng hình dạng `{message_id, status_code,
 * error_message?}` — KHÔNG có `message_type`, cũng KHÔNG có `device_id`. §15 Bán theo
 * Preset là ngoại lệ (`{message_id, status, meta?}`). Không nhìn nội dung mà biết phản
 * hồi thuộc yêu cầu nào — phải tra ngược `message_id`, và phải phân loại theo `kind` để
 * use-case này không nuốt mất phản hồi của use-case kia.
 */
export type KeyboardRequestKind = "set-mode" | "press-buttons" | "preset" | "stop-bump";

export interface IKeyboardPendingRequest {
  messageId: string;
  deviceId: string;
  kind: KeyboardRequestKind;
  createdAt: number;
}
