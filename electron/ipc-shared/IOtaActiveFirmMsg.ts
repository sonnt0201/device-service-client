
/**
 * for msg `content` field 
 */
export interface IOtaActiveFirmMsg {
    "message_id": string, // required, unique. Chính là message_id của yêu cầu. Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
    "message_type": number, // required. 6 - Active firm
    "device_id": string, // required, unique. ID của thiết bị. Ex: 001AC27B0048
}
