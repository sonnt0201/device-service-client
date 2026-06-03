

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
}

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
