import { IHasMsgType } from "./IHasMsgType";
import { KeyboardMode, MsgTypeValue } from "./MessageType";

export interface IReportKeyboardModeMsg extends IHasMsgType {
    "message_id": string;
    "message_type": MsgTypeValue.REPORT_KEYBOARD_MODE;
    "device_id": string;
    //* ============ PatchPlan 26-7-21 ========
    /**
     * D3: "physical" | "virtual" -> "manu" | "auto".
     *
     * D10: gói tin này giờ còn được thiết bị gửi CHỦ ĐỘNG (không cần Logi hỏi trước):
     * ngay khi thiết bị kết nối, và mỗi khi mode đổi (kể cả do gạt công tắc trên máy).
     * Trước đây nó chỉ là phản hồi của §10.
     */
    "mode": KeyboardMode;
    // * =========== End PatchPlan 26-7-21  ========
}
