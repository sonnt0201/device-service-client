import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IKeyboardPresetStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { ISetPresetMsg } from "@/ipc-shared/ISetPresetMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { normalizePresetStatus } from "../infrastructure/KeyboardStatusNormalizer";
import { DeviceServiceGateway } from "../infrastructure/DeviceServiceGateway";
import { KeyboardRequestRegistry } from "./KeyboardRequestRegistry";

/**
 * §15 Bán theo Preset (LogiAPI 11-08-2026).
 *
 * Hình dạng phản hồi RIÊNG `{message_id, status, meta?}` (không phải số học như §10/§12/§16)
 * VÀ tối đa 2 phản hồi/yêu cầu: "received" trước (KHÔNG xoá khỏi bảng — còn phản hồi thứ 2),
 * rồi "busy"/"done"/"error" mới là phản hồi cuối cùng (xoá khỏi bảng). Nếu phản hồi đầu
 * tiên đã là "busy" thì đó cũng là cuối cùng.
 */
export class RequestPresetSaleUseCase {
  private readonly _logger: IMainLogger = new MainLogger("RequestPresetSaleUseCase");
  private readonly _registry = KeyboardRequestRegistry.getInstance();
  private readonly _gateway = DeviceServiceGateway.getInstance();

  execute(message: ISetPresetMsg): void {
    if (!this._gateway.isListening) return;

    if (message.message_type !== MsgTypeValue.REQUEST_PRESET) {
      this._logger.warn(`Unsupported preset request type: ${message.message_type}`);
      return;
    }

    if (!message.device_id) {
      this._logger.warn("Preset request missing device_id.");
      return;
    }

    const hasCost = Number.isFinite(message.pre_cost);
    const hasVolume = Number.isFinite(message.pre_volume);

    // §15 yêu cầu ĐÚNG MỘT trong hai. Gửi cả hai thì Device Service trả status_code 1,
    // nên chặn luôn từ đây cho gọn.
    if (hasCost === hasVolume) {
      this._logger.warn("Preset request needs exactly one of pre_cost / pre_volume.");
      return;
    }

    this._registry.register(message.message_id, message.device_id, "preset");
    this._gateway.send(message);
  }

  /** Phản hồi §15, đã gắn kèm `device_id`. Xử lý cả phản hồi trung gian ("received") lẫn cuối cùng. */
  resolveResponse(data: IEventMsg): IKeyboardPresetStatusMsg | undefined {
    const status = normalizePresetStatus(data);
    if (!status) return undefined;

    const isTerminal = status.status !== "received";

    const pending = isTerminal
      ? this._registry.takeIfKind(status.message_id, "preset")
      : this._registry.peekIfKind(status.message_id, "preset");

    if (!pending) return undefined; // để use-case khác xử lý

    if (isTerminal && status.status !== "done") {
      this._logger.warn(
        `Preset ${status.message_id} failed: status=${status.status} ${status.meta ?? ""}`
      );
    }

    return { ...status, device_id: pending.deviceId };
  }
}
