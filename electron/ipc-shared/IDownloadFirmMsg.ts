import { IHasMsgType } from "./IHasMsgType"

/**
 * Refer to Device Service - Logi Service API: https://gitlab.com/2slab-logigo/logi-document/-/blob/main/system-architecture/logi-bk-api.md
 */
export interface IDownloadFirmMsg extends IHasMsgType {

    "message_id": string, // required, unique. Chính là message_id của yêu cầu.
    // Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
    "message_type": number, // required. 5 - Download firm
    "device_id": string, // required, unique. ID của thiết bị. Ex: 001AC27B0048
    "file": string, // required. Nội dung file firm.txt

}