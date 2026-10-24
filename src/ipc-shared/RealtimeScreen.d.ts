
//* ============ PatchPlan 26-7-21 ========
/**
 * D1/D2: §12 Stream Keyboard Screen Text bị gỡ bỏ. Màn hình bàn phím giờ đi chung
 * §1 Stream Screen Raw Data, cùng một trường `screen`. Không còn `keyboard_screen`.
 *
 * Hệ quả: TRÊN DÂY KHÔNG CÒN GÌ PHÂN BIỆT màn hình cột bơm với màn hình bàn phím.
 * Cả hai đều là `{device_id, timestamp, screen: string[]}`. Client phải tự phân loại,
 * và tín hiệu duy nhất có sẵn trong gói tin là SỐ DÒNG:
 *   - 3 dòng  -> màn hình chính của cột bơm (tiền / lít / đơn giá)
 *   - còn lại -> màn hình bàn phím (SEEN 1 dòng, vài model 4 dòng)
 *
 * Chỗ này sẽ sai nếu sau này có model bàn phím đúng 3 dòng. Muốn chắc chắn thì phải
 * tra `device_type` từ cache thiết bị (message_type 8) — chưa làm vì app này chỉ để test.
 */
type RealtimeScreenKind = "main" | "keyboard";

interface IRealtimeScreen {
    deviceId: string,
    timestamp: number,
    screen: string[],
    kind: RealtimeScreenKind,
}
// * =========== End PatchPlan 26-7-21  ========
