import { IKeyboardButtonPressMsg } from "@/ipc-shared/IKeyboardButtonPressMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { KeyboardRequestKind } from "../domain/PendingKeyboardRequest";
import { NumericKeyboardCommandUseCase } from "./NumericKeyboardCommandUseCase";

/**
 * §12 Nhấn phím ảo.
 *
 * Trước D6 có ack `status: "received"` rồi mới có kết quả, và Device Service không đăng ký
 * message_id của yêu cầu nhấn phím vào bảng đối chiếu (nay đã sửa). D6 bỏ ack trung gian
 * và bắt buộc "mọi yêu cầu từ Logi đều có phản hồi", nên giờ phải nghe và đẩy kết quả lên
 * giao diện — xem {@link NumericKeyboardCommandUseCase.resolveResponse}.
 */
export class PressVirtualButtonsUseCase extends NumericKeyboardCommandUseCase<IKeyboardButtonPressMsg> {
  protected readonly kind: KeyboardRequestKind = "press-buttons";
  protected readonly expectedMessageType = MsgTypeValue.KEYBOARD_PRESS_VIRTUAL_BUTTONS;
  protected readonly label = "press virtual buttons";

  constructor() {
    super("PressVirtualButtonsUseCase");
  }
}
