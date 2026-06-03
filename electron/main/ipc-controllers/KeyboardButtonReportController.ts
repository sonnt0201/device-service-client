import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import {
  IKeyboardButtonAction,
  IReportKeyboardButtonsPressedMsg,
} from "../../../src/ipc-shared/IReportKeyboardButtonsPressedMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { IObserver } from "../base/IObserver";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";

class KeyboardButtonReportController
  extends IPCControllerBaseV2<void, IReportKeyboardButtonsPressedMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("KeyboardButtonReportController");

  private _eventExchangeDSListener = EventExchangeDSListener.getInstance();

  constructor() {
    super();
    this._eventExchangeDSListener.eventMsgNotifier.subcribe(this);
  }

  channel(): string {
    return "keyboard-buttons-pressed";
  }

  update(data: IEventMsg): void {
    if (data.content.message_type !== MsgTypeValue.KEYBOARD_REPORT_BUTTONS_PRESSED) return;

    const rawMessage = data.content as Partial<IReportKeyboardButtonsPressedMsg>;

    if (!rawMessage.device_id || !Array.isArray(rawMessage.button_actions)) {
      this._logger?.warn(`Malformed keyboard button report: ${JSON.stringify(data.content)}`);
      return;
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
      this._logger?.warn(`Keyboard button report has no valid actions: ${JSON.stringify(data.content)}`);
      return;
    }

    const normalized: IReportKeyboardButtonsPressedMsg = {
      message_id: String(rawMessage.message_id ?? data.id),
      message_type: MsgTypeValue.KEYBOARD_REPORT_BUTTONS_PRESSED,
      device_id: String(rawMessage.device_id),
      button_actions: normalizedActions,
    };

    this.sendMsgToTargetWindow(normalized);
  }
}

export const keyboardButtonReportController = new KeyboardButtonReportController();
