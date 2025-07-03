import { IHasMsgType } from "./IHasMsgType";

/**
 * Dependencies: IHasMsgType
 * 
 * Json format for Raw Log (Pump Session) received from Device Service.
 */
export interface IEncodedLog extends IHasMsgType {
	"message_id": string,	// required, unique. Tạo theo uuid_v4. Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
    "message_type": number,          // required. 0 - Report Log/SubLog; 1 - Report Preset; 2 - Set Relay
    

    // Các trường chung
    "device_id": string,              // required, unique. ID của thiết bị. Ex: 001AC27B0048
    "log_id": string,                 // required, unique. Tạo theo uuid_v4. Ex: 6a079ec1-5d36-4e59-b9b5-13011b388b58
    "timestamp": number,                // required. Thời điểm sinh ra sự kiện Log/SubLog này, thường là thời điểm hiện tại. Ex: 1725980616789
    "cost": number,                      // required. Tổng tiền tính đến thời điểm tạo sự kiện này. Ex: 100.0 
    "volume": number,                    // required. Tổng lít tính đến thời điểm tạo sự kiện này. Ex: 5.0 
    "price": number,                     // required. Đơn giá tính đến thời điểm tạo sự kiện này: Ex: 20.0
    "event_type": string,             // required. Loại sự kiện. Có 2 giá trị: 
                                        //  "LOG" - dữ liệu Log
                                        //  "SUBLOG" - dữ liệu SubLog
    
    // Đối với trường hợp: event_type = "LOG", sẽ có 5 trường bên dưới
 	"created_timestamp": number,        // Thời điểm Log được tạo, hay là thời điểm bắt đầu bơm. Ex: 1725980612000
    "log_type": number,                 // Loại Log. Trường này dự phòng về sau. Hiện tại có giá trị = 0
    
    // Đối với trường hợp: event_type = "SUBLOG", sẽ có 3 trường bên dưới
    "sublog_id": string,              // unique. Tạo theo uuid_v4. Ex: 7a4bca17-167f-457c-835c-c498df1cae47
    "sublog_type": number,              // Loại SubLog. Hiện tại có 2 giá trị: 
                                        //  0 - SubLog do chốt Log theo logic thông thường
                                        //  1 - Có lỗi (lỗi logic hoặc trên màn hình báo lỗi).
                                        // Có thể có thêm các giá trị khác về sau
    "note": string                    // Ghi chú thêm về SubLog. Thường để cung cấp thông tin thêm khi có Lỗi
}
