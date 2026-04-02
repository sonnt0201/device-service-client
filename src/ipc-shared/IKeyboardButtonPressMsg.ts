import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

export interface IKeyboardButtonPressMsg extends IHasMsgType {
     "message_id": string,     // required, unique. Tạo theo uuid_v4. Ex: 6a079ec1-5d36-4e59-b9b5-13011b384567
    "message_type": MsgTypeValue,          // required.

    "device_id": string,      // required, unique. ID của thiết bị. Ex: 001AC27B0048
	
	/// giá trị là chuỗi các ID của nút nhấn, ví dụ [1, 3, 10]
	/// ID ứng với nút nào tuân theo quy ước từng loại bàn phím
	"button_list": number[] 
}
// todo wrong message format, need to be fixed according to API document for Device Service - Logi Service.