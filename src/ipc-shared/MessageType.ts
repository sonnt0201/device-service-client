

/**
 * No-Dependency
 * Message type value, refer to **API document for Device Service - Logi Service.**
 * 
 * must be numeric enum 'cause it's number in json message API
 */
export enum MsgTypeValue {
    LOG_SUBLOG = 0,
    PRESET = 1,
    SET_RELAY = 2,
    REPORT_RELAY = 3,
    DOWNLOAD_FIRM = 5,
    ACTIVE_FIRM = 6,
    GET_DEVICES = 8,
    SET_KEYBOARD_MODE = 9,
    REPORT_KEYBOARD_MODE = 10,

    KEYBOARD_PRESS_VIRTUAL_BUTTONS = 12,
    KEYBOARD_REPORT_BUTTONS_PRESSED = 13,
    REQUEST_PRESET = 14,
    STOP_BUMP = 15,

    //* ============ PatchPlan 26-10-18 ========
    /** Nội bộ, không public: state hiện tại của 3 máy phát hiện trên thiết bị (LogiAPI §17) */
    REPORT_DETECTOR_STATE = 16,
    // * =========== End PatchPlan 26-10-18  ========
}

//* ============ PatchPlan 26-7-21 ========
/**
 * Chế độ bàn phím, theo LogiAPI 21-07-2026 (D3).
 *
 * - `manu` = Thủ công: thiết bị báo lại thao tác người vận hành bấm (§14).
 * - `auto` = Tự động: Logi điều khiển bàn phím (§12 nhấn phím ảo, §15 bán theo preset).
 *
 * Tương ứng 1:1 với `KBMODE_PHYSICAL` / `KBMODE_VIRTUAL` bên firmware — nhưng đó là
 * tên của cái mux CPLD (phím thật hay phím ảo), còn manu/auto là tên của *chế độ bán*.
 * Cùng 1 bit, khác khái niệm; đừng gộp làm một.
 */
export type KeyboardMode = "manu" | "auto";

/**
 * `status_code` dùng chung cho mọi phản hồi yêu cầu bàn phím (LogiAPI §10, §12, §15 — D9).
 *
 * Từ 21-07-2026 mỗi yêu cầu chỉ có ĐÚNG MỘT phản hồi, không còn ack trung gian
 * `status: "received"` nữa (D5/D6).
 */
export enum KeyboardStatusCode {
    OK = 0,
    INVALID_REQUEST = 1,
    DEVICE_BUSY = 2,
    DEVICE_DISCONNECTED = 3,
    EXECUTION_ERROR = 4,
}

/**
 * Nhãn tiếng Việt cho `status_code`. Đặt ở đây (module không phụ thuộc gì)
 * để cả main process lẫn giao diện dùng chung một cách gọi tên.
 */
export function describeKeyboardStatus(statusCode: number): string {
    switch (statusCode) {
        case KeyboardStatusCode.OK:
            return "thành công";
        case KeyboardStatusCode.INVALID_REQUEST:
            return "yêu cầu sai";
        case KeyboardStatusCode.DEVICE_BUSY:
            return "thiết bị bận";
        case KeyboardStatusCode.DEVICE_DISCONNECTED:
            return "mất kết nối";
        case KeyboardStatusCode.EXECUTION_ERROR:
            return "lỗi khi thực hiện";
        default:
            return `không rõ (${statusCode})`;
    }
}
// * =========== End PatchPlan 26-7-21  ========

//* ============ PatchPlan 26-8-11 ========
/**
 * `status` dùng riêng cho §15 Bán theo Preset (LogiAPI 11-08-2026), KHÁC với
 * `status_code` số học của §10/§12/§16. Một yêu cầu preset gửi TỐI ĐA 2 phản hồi:
 * "received" rồi "busy" | "done" | "error" (hoặc chỉ "busy" một mình nếu Device
 * Service từ chối ngay, không có phản hồi thứ 2).
 */
export type PresetStatusValue = "received" | "busy" | "done" | "error";

export function describePresetStatus(status: PresetStatusValue): string {
    switch (status) {
        case "received":
            return "đã nhận, đang xử lý";
        case "busy":
            return "thiết bị bận";
        case "done":
            return "thành công";
        case "error":
            return "lỗi";
        default:
            return `không rõ (${status})`;
    }
}
// * =========== End PatchPlan 26-8-11  ========

/**
 * Button ID to label mapping for virtual keyboard.
 * ID 0-24 maps to: F2, L, F3, P, TOTAL, F4, $, F1, 9, 0, E, 00, 000, C, TIME, F5, 7, 8, 4, 3, 1, 2, 6, 5, S
 */
export const KEYBOARD_BUTTON_ID_MAP: Record<number, string> = {
    0: "F2", 1: "L", 2: "F3", 3: "P", 4: "TOTAL", 5: "F4",
    6: "$", 7: "F1", 8: "9", 9: "0", 10: "E", 11: "00",
    12: "000", 13: "C", 14: "TIME", 15: "F5", 16: "7", 17: "8",
    18: "4", 19: "3", 20: "1", 21: "2", 22: "6", 23: "5", 24: "S"
};

/**
 * Reverse mapping: label to button ID
 */
export const KEYBOARD_LABEL_TO_ID_MAP: Record<string, number> = Object.entries(KEYBOARD_BUTTON_ID_MAP)
    .reduce((acc, [id, label]) => ({ ...acc, [label]: parseInt(id) }), {});
