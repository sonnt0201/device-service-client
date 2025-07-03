
import {  IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";
export interface ISetRelayMsg extends IHasMsgType {
    
    "message_id": string,     // required, unique. Tạo theo uuid_v4. Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
    "message_type": MsgTypeValue,          // required. 2 - Set Relay

    "device_id": string,      // required, unique. ID của thiết bị. Ex: 001AC27B0048

	"relays": 		            // Danh sách trạng thái của các Relay
        {
            "relay_id": number,         // required. ID/Chỉ số của Relay. Hiện tại có 2 Relay nên sẽ có ID là 0 hoặc 1
            "state": number,            // required. Có 2 giá trị: 
                                        // 0 - Tắt
                                        // 1 - Bật
            "off_condition"?: {
                "cost": number,          //optional. Ngưỡng tiền để tắt Relay. Nếu không đặt điều kiện hoặc đặt điều kiện theo lit thì bỏ trường này
                "volume": number         //optional. Ngưỡng lit để tắt Relay. Nếu không đặt điều kiện hoặc đặt điều kiện theo tiền thì bỏ trường này
            }
        }[]
    


}