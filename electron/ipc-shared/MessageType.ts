

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
    ACTIVE_FIRM = 6
}
