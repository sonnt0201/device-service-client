import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IKeyboardStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { KeyboardRequestKind } from "../domain/PendingKeyboardRequest";
import { normalizeKeyboardStatus } from "../infrastructure/KeyboardStatusNormalizer";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { KeyboardRequestRegistry } from "./KeyboardRequestRegistry";

/**
 * Khung chung cho các yêu cầu bàn phím có phản hồi số học `{message_id, status_code}`:
 * §12 Nhấn phím ảo và §16 Dừng bơm (D6/D9 — mỗi yêu cầu đúng 1 phản hồi terminal,
 * không mang `device_id`, tra ngược qua {@link KeyboardRequestRegistry}).
 *
 * §15 Bán theo Preset KHÔNG dùng khung này — hình dạng `{status, meta}` riêng.
 */
export abstract class NumericKeyboardCommandUseCase<
  TCommand extends { message_id: string; message_type: number; device_id?: string }
> {
  protected abstract readonly kind: KeyboardRequestKind;
  protected abstract readonly expectedMessageType: MsgTypeValue;
  protected abstract readonly label: string;

  protected readonly _logger: IMainLogger;
  protected readonly _registry = KeyboardRequestRegistry.getInstance();
  protected readonly _gateway = DeviceServiceGateway.getInstance();

  constructor(loggerName: string) {
    this._logger = new MainLogger(loggerName);
  }

  execute(message: TCommand): void {
    if (!this._gateway.isListening) return;

    if (message.message_type !== this.expectedMessageType) {
      this._logger.warn(`Unsupported ${this.label} message type: ${message.message_type}`);
      return;
    }

    if (!message.device_id) {
      this._logger.warn(`${this.label} request missing device_id.`);
      return;
    }

    if (!this.validate(message)) return;

    this._registry.register(message.message_id, message.device_id, this.kind);
    this._gateway.send(message);
  }

  /** Phản hồi terminal cho yêu cầu này, đã gắn kèm `device_id` tra từ bảng đối chiếu. */
  resolveResponse(data: IEventMsg): IKeyboardStatusMsg | undefined {
    const status = normalizeKeyboardStatus(data);
    if (!status) return undefined;

    const pending = this._registry.takeIfKind(status.message_id, this.kind);
    if (!pending) return undefined; // để use-case khác xử lý

    return { ...status, device_id: pending.deviceId };
  }

  /** Kiểm tra bổ sung theo từng loại lệnh. Mặc định không có. */
  protected validate(_message: TCommand): boolean {
    return true;
  }
}
