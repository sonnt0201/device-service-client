import { IHasMsgType } from "./IHasMsgType";

export interface IReportRelayMsg extends IHasMsgType{
    
    "message_id": string,     // required, unique. Tạo theo uuid_v4. Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
    "message_type": number,          // required. 3 - Report Relay State

	"device_id": string,      // required, unique. ID của thiết bị. Ex: 001AC27B0048
    "timestamp": number,        // required. Ex: 1725980616789

    "cost": number,              // required. Tổng tiền hiện tại. Ex: 100.0 
    "volume": number,            // required. Tổng lít hiện tại. Ex: 5.0 
    "price": number,             // required. Đơn giá hiện tại. Ex: 20.0

    "relays":                 // Danh sách trạng thái của các Relay
        {
            "relay_id": number,         // required. ID/Chỉ số của Relay. Hiện tại có 2 Relay nên sẽ có ID là 0 hoặc 1
            "state": number,            // required. Có 2 giá trị: 
                                        // 0 - Tắt
                                        // 1 - Bật
					                    // 2 - Lỗi
        }[]
    


}