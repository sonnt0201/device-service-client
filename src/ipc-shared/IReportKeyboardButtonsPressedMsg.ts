import { IHasMsgType } from "./IHasMsgType";
import { MsgTypeValue } from "./MessageType";

export interface IKeyboardButtonAction {
  button_list: number[];
  timestamp: number;
}

export interface IReportKeyboardButtonsPressedMsg extends IHasMsgType {
  message_id: string;
  message_type: MsgTypeValue.KEYBOARD_REPORT_BUTTONS_PRESSED;
  device_id: string;
  button_actions: IKeyboardButtonAction[];
}
