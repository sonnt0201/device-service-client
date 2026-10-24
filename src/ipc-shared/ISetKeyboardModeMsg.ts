import { IHasMsgType } from "./IHasMsgType";
import { KeyboardMode, MsgTypeValue } from "./MessageType";

export interface ISetKeyboardModeMsg extends IHasMsgType {
    "message_id": string;     // required, unique. Tạo theo uuid_v4
    "message_type": MsgTypeValue.SET_KEYBOARD_MODE;  // required. SET_KEYBOARD_MODE = 9
    "device_id": string;      // required, unique. ID của thiết bị
    //* ============ PatchPlan 26-7-21 ========
    /**
     * D3: "physical" | "virtual" -> "manu" | "auto".
     *
     * D5: phản hồi của yêu cầu này giờ là KẾT QUẢ CUỐI CÙNG
     * (`{message_id, status_code, error_message?}` — xem {@link IKeyboardStatusMsg}),
     * không còn "báo kết quả sau qua Report Keyboard Mode" nữa.
     */
    "mode": KeyboardMode; // required. Chế độ bàn phím
    // * =========== End PatchPlan 26-7-21  ========
}
