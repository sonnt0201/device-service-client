import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

export interface IReportKeyboardModeMsg extends IHasMsgType {
    "message_id": string;
    "message_type": MsgTypeValue.REPORT_KEYBOARD_MODE;
    "device_id": string;
    "mode": "physical" | "virtual";
}
