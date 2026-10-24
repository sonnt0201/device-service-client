import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IReportKeyboardModeMsg } from "@/ipc-shared/IReportKeyboardModeMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { isKeyboardMode } from "../domain/KeyboardMode";

/**
 * §11 Report Keyboard Mode — nguồn sự thật về chế độ bàn phím của từng thiết bị.
 *
 * Từ D10 thiết bị gửi CHỦ ĐỘNG gói này khi vừa kết nối và khi mode đổi trên máy, không
 * chỉ khi Logi vừa đặt mode. Projection giữ ảnh chụp mới nhất theo device để §handle
 * (giao diện hỏi mode hiện tại) trả lời được ngay.
 */
export class KeyboardModeProjection {
  private readonly _logger: IMainLogger = new MainLogger("KeyboardModeProjection");
  private readonly _modeByDevice = new Map<string, IReportKeyboardModeMsg>();

  /** Đọc một gói tin từ Device Service; trả về bản chuẩn hoá nếu đó là §11, ngược lại `undefined`. */
  applyReport(data: IEventMsg): IReportKeyboardModeMsg | undefined {
    const messageType = Number(data.content.message_type);
    if (messageType !== MsgTypeValue.REPORT_KEYBOARD_MODE) return undefined;

    const msg = data.content as Partial<IReportKeyboardModeMsg>;
    if (!msg.device_id || !isKeyboardMode(msg.mode)) {
      this._logger.warn(`Malformed keyboard mode report: ${JSON.stringify(data.content)}`);
      return undefined;
    }

    const normalized: IReportKeyboardModeMsg = {
      message_id: String(msg.message_id ?? data.id),
      message_type: MsgTypeValue.REPORT_KEYBOARD_MODE,
      device_id: String(msg.device_id),
      mode: msg.mode,
    };

    this._modeByDevice.set(normalized.device_id, normalized);
    return normalized;
  }

  getMode(deviceId?: string): IReportKeyboardModeMsg | undefined {
    if (deviceId) {
      return this._modeByDevice.get(deviceId);
    }

    const first = this._modeByDevice.values().next();
    return first.done ? undefined : first.value;
  }
}
