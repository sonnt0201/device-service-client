import { IEventMsg } from "@/ipc-shared/IEventMsg";
import {
  IKeyboardButtonAction,
  IReportKeyboardButtonsPressedMsg,
} from "@/ipc-shared/IReportKeyboardButtonsPressedMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";

/**
 * §13 Report Buttons Pressed — chế độ Thủ công: thiết bị báo lại phím người vận hành bấm.
 * Chỉ chuẩn hoá và lọc, không giữ trạng thái.
 */
export class ButtonsPressedProjection {
  private readonly _logger: IMainLogger = new MainLogger("ButtonsPressedProjection");

  apply(data: IEventMsg): IReportKeyboardButtonsPressedMsg | undefined {
    if (data.content.message_type !== MsgTypeValue.KEYBOARD_REPORT_BUTTONS_PRESSED) return undefined;

    const rawMessage = data.content as Partial<IReportKeyboardButtonsPressedMsg>;

    if (!rawMessage.device_id || !Array.isArray(rawMessage.button_actions)) {
      this._logger.warn(`Malformed keyboard button report: ${JSON.stringify(data.content)}`);
      return undefined;
    }

    const normalizedActions: IKeyboardButtonAction[] = rawMessage.button_actions
      .filter((action): action is IKeyboardButtonAction => {
        return Array.isArray(action?.button_list) && Number.isFinite(action?.timestamp);
      })
      .map((action) => ({
        button_list: action.button_list
          .map((buttonId) => Number(buttonId))
          .filter((buttonId) => Number.isInteger(buttonId)),
        timestamp: Number(action.timestamp),
      }))
      .filter((action) => action.button_list.length > 0);

    if (normalizedActions.length === 0) {
      this._logger.warn(`Keyboard button report has no valid actions: ${JSON.stringify(data.content)}`);
      return undefined;
    }

    return {
      message_id: String(rawMessage.message_id ?? data.id),
      message_type: MsgTypeValue.KEYBOARD_REPORT_BUTTONS_PRESSED,
      device_id: String(rawMessage.device_id),
      button_actions: normalizedActions,
    };
  }
}
