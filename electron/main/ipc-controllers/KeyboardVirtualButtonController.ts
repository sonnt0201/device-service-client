import { IKeyboardButtonPressMsg } from "../../../src/ipc-shared/IKeyboardButtonPressMsg";
import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBase } from "../base";
import { MainLogger } from "../base/MainLog";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";

class KeyboardVirtualButtonController extends IPCControllerBase<IKeyboardButtonPressMsg, never> {
  private _logger = new MainLogger("KeyboardVirtualButtonController");

  channel(): string {
    return "keyboard-press-virtual-buttons";
  }

  on(event: Electron.CrossProcessExports.IpcMainEvent, message: IKeyboardButtonPressMsg): void {
    if (!EventExchangeDSListener.getInstance().startListening) return;

    if (message.message_type !== MsgTypeValue.KEYBOARD_PRESS_VIRTUAL_BUTTONS) {
      this._logger.warn(`Unsupported keyboard message type: ${message.message_type}`);
      return;
    }

    const messageToSendDS: IEventMsg = {
      id: message.message_id,
      content: message,
    };

    EventExchangeDSListener
      .getInstance()
      .send(JSON.stringify(messageToSendDS.content));
  }
}

export const keyboardVirtualButtonController = new KeyboardVirtualButtonController();
