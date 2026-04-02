import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

export interface ISetKeyboardModeMsg extends IHasMsgType {
    "message_id": string;     // required, unique. Tạo theo uuid_v4
    "message_type": MsgTypeValue.SET_KEYBOARD_MODE;  // required. SET_KEYBOARD_MODE = 9
    "device_id": string;      // required, unique. ID của thiết bị
    "mode": "physical" | "virtual"; // required. Chế độ bàn phím
}
