//* ============ PatchPlan 26-7-21 ========
/**
 * Bảng đối chiếu yêu cầu bàn phím đang chờ phản hồi.
 *
 * VÌ SAO CẦN: từ LogiAPI 21-07-2026 (D5/D6/D9), phản hồi cuối cùng của các yêu cầu bàn
 * phím (§10 đặt chế độ, §12 nhấn phím ảo, §16 dừng bơm) đều có cùng một hình dạng
 * `{message_id, status_code, error_message?}` — KHÔNG có `message_type`, cũng KHÔNG có
 * `device_id`. §15 bán theo Preset là ngoại lệ từ 11-08-2026: hình dạng riêng
 * `{message_id, status, meta?}`, xem PresetRequestController.
 *
 * Nghĩa là khi một phản hồi rơi vào, không thể nhìn nội dung mà biết nó thuộc yêu cầu nào.
 * Cách duy nhất là tra ngược `message_id` trong danh sách đã gửi đi. Cả 3 controller cùng
 * quan sát một luồng sự kiện, nên bảng này phải dùng chung và phải phân loại theo `kind`
 * để controller này không nuốt mất phản hồi của controller kia.
 */

import { IKeyboardPendingRequest, KeyboardRequestKind } from "../domain/PendingKeyboardRequest";

export type { IKeyboardPendingRequest, KeyboardRequestKind };

/**
 * Quá hạn phía client. Để rộng hơn hạn 15s của Device Service, vì Device Service đã tự
 * trả `status_code: 3` khi hết hạn — cái này chỉ để dọn rác khi Device Service chết hẳn.
 */
const PENDING_MAX_AGE_MS = 60_000;

/**
 * [Singleton Design Pattern]
 */
export class KeyboardRequestRegistry {
  private static _instance: KeyboardRequestRegistry;

  private _pending = new Map<string, IKeyboardPendingRequest>();

  private constructor() { }

  public static getInstance(): KeyboardRequestRegistry {
    if (!KeyboardRequestRegistry._instance) {
      KeyboardRequestRegistry._instance = new KeyboardRequestRegistry();
    }
    return KeyboardRequestRegistry._instance;
  }

  register(messageId: string, deviceId: string, kind: KeyboardRequestKind): void {
    this._sweep();

    this._pending.set(messageId, {
      messageId,
      deviceId,
      kind,
      createdAt: Date.now(),
    });
  }

  /**
   * Lấy ra và xoá yêu cầu đang chờ, CHỈ KHI nó đúng loại của controller đang hỏi.
   *
   * Trả undefined nếu không có, hoặc có nhưng khác loại — khi đó controller phải bỏ qua
   * phản hồi để controller đúng loại xử lý.
   */
  takeIfKind(messageId: string, kind: KeyboardRequestKind): IKeyboardPendingRequest | undefined {
    const pending = this._pending.get(messageId);
    if (!pending || pending.kind !== kind) return undefined;

    this._pending.delete(messageId);
    return pending;
  }

  //* ============ PatchPlan 26-8-11 ========
  /**
   * Giống `takeIfKind` nhưng KHÔNG xoá khỏi bảng.
   *
   * §15 Bán theo Preset (11-08-2026) gửi tối đa 2 phản hồi cho 1 yêu cầu
   * ("received" rồi "done"/"error"/"busy"). Nếu dùng `takeIfKind` cho phản hồi
   * "received" thì mục sẽ bị xoá mất, và phản hồi thứ 2 sẽ không tra được nữa.
   * Dùng hàm này cho phản hồi không phải cuối cùng; dùng `takeIfKind` cho phản
   * hồi cuối cùng để dọn bảng.
   */
  peekIfKind(messageId: string, kind: KeyboardRequestKind): IKeyboardPendingRequest | undefined {
    const pending = this._pending.get(messageId);
    if (!pending || pending.kind !== kind) return undefined;

    return pending;
  }
  // * =========== End PatchPlan 26-8-11  ========

  private _sweep(): void {
    const now = Date.now();

    for (const [messageId, pending] of this._pending) {
      if (now - pending.createdAt > PENDING_MAX_AGE_MS) {
        this._pending.delete(messageId);
      }
    }
  }
}
// * =========== End PatchPlan 26-7-21  ========
