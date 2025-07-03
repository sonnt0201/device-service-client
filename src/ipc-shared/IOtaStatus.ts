
export enum OtaStatusValue {
    SUCCESS = 0,
    OTHER_ERROR = 1
};

// export interface IOtaStatus {
//     "message_id": string, // required, unique. Chính là message_id của yêu cầu.
//     // Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
//     "status_code": OtaStatusValue // 0: thành công, != 0: lỗi

// }