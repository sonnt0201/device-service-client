

/**
 * No-Dependency
 * Message type value, refer to **API document for Device Service - Logi Service.**
 * 
 * must be numeric enum 'cause it's number in json message API
 */
export  enum MsgTypeValue {
    LOG_SUBLOG = 0,
    PRESET = 1,
    SET_RELAY = 2,
    REPORT_RELAY = 3,


}

/**
 * No-Dependency
 * 
 * for incoming event messages from device service, it must have a message type
 */
 export interface IHasMsgType {
    "message_type": MsgTypeValue,
    "message_id": string
}

