import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { ISetKeyboardModeMsg } from "@/ipc-shared/ISetKeyboardModeMsg";
import { describeKeyboardStatus, KeyboardStatusCode, MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { isKeyboardMode } from "../domain/KeyboardMode";
import { normalizeKeyboardStatus } from "../infrastructure/KeyboardStatusNormalizer";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { KeyboardRequestRegistry } from "./KeyboardRequestRegistry";

/**
 * §9/§10 Đặt chế độ bàn phím.
 *
 * `execute` — kiểm tra lệnh từ giao diện, ghi vào bảng đối chiếu rồi gửi cho Device Service.
 * `handleResponse` — nhận phản hồi terminal (D5: `{message_id, status_code}`, không có
 * device_id/message_type). Trả về `true` nếu gói tin là phản hồi số học của một yêu cầu
 * bàn phím (để controller không xử lý tiếp như §11 Report Keyboard Mode); chỉ ghi cảnh
 * báo khi nó đúng là phản hồi của một yêu cầu đặt-chế-độ đang chờ và bị lỗi.
 */
export class SetKeyboardModeUseCase {
  private readonly _logger: IMainLogger = new MainLogger("SetKeyboardModeUseCase");
  private readonly _registry = KeyboardRequestRegistry.getInstance();
  private readonly _gateway = DeviceServiceGateway.getInstance();

  execute(message: ISetKeyboardModeMsg): void {
    if (!this._gateway.isListening) return;

    if (message.message_type !== MsgTypeValue.SET_KEYBOARD_MODE) {
      this._logger.warn(`Unsupported keyboard mode set type: ${message.message_type}`);
      return;
    }

    // D3: chỉ chấp nhận manu/auto. Device Service sẽ trả status_code 1 nếu nhận giá trị lạ,
    // nhưng chặn sớm ở đây thì lỗi hiện ra ngay chỗ gõ sai.
    if (!isKeyboardMode(message.mode)) {
      this._logger.warn(`Unknown keyboard mode: ${message.mode}`);
      return;
    }

    if (!message.device_id) {
      this._logger.warn("Set keyboard mode request missing device_id.");
      return;
    }

    // D5: phản hồi của §10 giờ là kết quả cuối cùng và KHÔNG mang device_id,
    // nên phải ghi lại message_id để tra ngược khi phản hồi về.
    this._registry.register(message.message_id, message.device_id, "set-mode");

    this._gateway.send(message);
  }

  /**
   * @returns `true` nếu gói tin là một phản hồi số học (đã được tiêu thụ ở đây),
   * `false` nếu không phải — khi đó controller mới thử đọc nó như §11 Report Keyboard Mode.
   */
  handleResponse(data: IEventMsg): boolean {
    const status = normalizeKeyboardStatus(data);
    if (!status) return false;

    const pending = this._registry.takeIfKind(status.message_id, "set-mode");

    if (pending && status.status_code !== KeyboardStatusCode.OK) {
      this._logger.warn(
        `Set keyboard mode ${status.message_id} failed: ${describeKeyboardStatus(status.status_code)} ${status.error_message ?? ""}`
      );
    }

    return true;
  }
}
