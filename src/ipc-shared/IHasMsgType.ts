import { MsgTypeValue } from "./MessageType";


/**
 * No-Dependency
 * 
 * for incoming event messages from device service, it must have a message type
 */
 export interface IHasMsgType {
    "message_type": MsgTypeValue,
    "message_id": string
}

