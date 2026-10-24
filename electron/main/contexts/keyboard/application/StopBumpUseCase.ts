import { IStopBumpMsg } from "@/ipc-shared/IStopBumpMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { KeyboardRequestKind } from "../domain/PendingKeyboardRequest";
import { NumericKeyboardCommandUseCase } from "./NumericKeyboardCommandUseCase";

/**
 * §16 Stop bump (LogiAPI 11-08-2026). Cùng hình dạng phản hồi số học
 * `{message_id, status_code, error_message?}` như §10/§12, nên dùng chung khung
 * {@link NumericKeyboardCommandUseCase} — không phải hình dạng `{status, meta}` riêng
 * của §15 Bán theo Preset.
 */
export class StopBumpUseCase extends NumericKeyboardCommandUseCase<IStopBumpMsg> {
  protected readonly kind: KeyboardRequestKind = "stop-bump";
  protected readonly expectedMessageType = MsgTypeValue.STOP_BUMP;
  protected readonly label = "stop bump";

  constructor() {
    super("StopBumpUseCase");
  }
}
