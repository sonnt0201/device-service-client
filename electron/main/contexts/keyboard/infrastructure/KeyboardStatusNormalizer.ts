//* ============ PatchPlan 26-7-21 ========
import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IKeyboardPresetStatusMsg, IKeyboardStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { KeyboardStatusCode, PresetStatusValue } from "@/ipc-shared/MessageType";

/**
 * Đọc gói tin từ Device Service và trả về phản hồi terminal của một yêu cầu bàn phím
 * dạng số (§10 đặt chế độ, §12 nhấn phím ảo, §16 dừng bơm), hoặc undefined nếu gói tin
 * không phải loại đó.
 *
 * Nhận diện: có `message_id` và có `status_code` kiểu số. Gói tin dạng `{status: string}`
 * của §15 Bán theo Preset (xem `normalizePresetStatus`) sẽ KHÔNG khớp — có chủ ý: đừng lẫn
 * 2 hình dạng phản hồi với nhau.
 */
export function normalizeKeyboardStatus(data: IEventMsg): IKeyboardStatusMsg | undefined {
    const content = data?.content as Record<string, unknown> | undefined;
    if (!content) return undefined;

    const messageId = content["message_id"];
    const statusCode = content["status_code"];

    if (typeof messageId !== "string" || messageId.length === 0) return undefined;
    if (typeof statusCode !== "number" || !Number.isInteger(statusCode)) return undefined;

    const result: IKeyboardStatusMsg = {
        message_id: messageId,
        status_code: statusCode as KeyboardStatusCode,
    };

    const errorMessage = content["error_message"];
    if (typeof errorMessage === "string" && errorMessage.length > 0) {
        result.error_message = errorMessage;
    }

    return result;
}
// * =========== End PatchPlan 26-7-21  ========

//* ============ PatchPlan 26-8-11 ========
const PRESET_STATUS_VALUES: readonly PresetStatusValue[] = ["received", "busy", "done", "error"];

/**
 * Đọc gói tin từ Device Service và trả về phản hồi của §15 Bán theo Preset
 * (LogiAPI 11-08-2026), hoặc undefined nếu gói tin không phải loại đó.
 *
 * Nhận diện: có `message_id` và `status` là MỘT TRONG 4 chuỗi hợp lệ. Một yêu cầu có
 * thể sinh ra tối đa 2 gói tin khớp hàm này - "received" trước, rồi "busy"/"done"/"error"
 * (hoặc chỉ một mình "busy"). Xem `PresetRequestController` và
 * `KeyboardRequestRegistry.peekIfKind` để biết cách phân biệt phản hồi nào là cuối cùng.
 */
export function normalizePresetStatus(data: IEventMsg): IKeyboardPresetStatusMsg | undefined {
    const content = data?.content as Record<string, unknown> | undefined;
    if (!content) return undefined;

    const messageId = content["message_id"];
    const status = content["status"];

    if (typeof messageId !== "string" || messageId.length === 0) return undefined;
    if (typeof status !== "string" || !PRESET_STATUS_VALUES.includes(status as PresetStatusValue)) return undefined;

    const result: IKeyboardPresetStatusMsg = {
        message_id: messageId,
        status: status as PresetStatusValue,
    };

    const meta = content["meta"];
    if (typeof meta === "string" && meta.length > 0) {
        result.meta = meta;
    }

    return result;
}
// * =========== End PatchPlan 26-8-11  ========
