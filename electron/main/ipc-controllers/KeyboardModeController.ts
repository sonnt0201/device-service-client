import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import { IReportKeyboardModeMsg } from "../../../src/ipc-shared/IReportKeyboardModeMsg";
import { ISetKeyboardModeMsg } from "../../../src/ipc-shared/ISetKeyboardModeMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { IObserver } from "../base/IObserver";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";

type KeyboardModeQuery = { device_id?: string } | undefined;

class KeyboardModeController extends IPCControllerBaseV2<ISetKeyboardModeMsg, IReportKeyboardModeMsg | undefined>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("KeyboardModeController");

  private _eventExchangeDSListener = EventExchangeDSListener.getInstance();
  private _modeByDevice = new Map<string, IReportKeyboardModeMsg>();

  constructor() {
    super();
    this._eventExchangeDSListener.eventMsgNotifier.subcribe(this);
  }

  channel(): string {
    return "keyboard-mode";
  }

  on(event: Electron.CrossProcessExports.IpcMainEvent, message: ISetKeyboardModeMsg): void {
    if (!this._eventExchangeDSListener.startListening) return;

    if (message.message_type !== MsgTypeValue.SET_KEYBOARD_MODE) {
      this._logger?.warn(`Unsupported keyboard mode set type: ${message.message_type}`);
      return;
    }

    const msgToSendDS: IEventMsg = {
      id: message.message_id,
      content: message,
    };

    this._eventExchangeDSListener.send(JSON.stringify(msgToSendDS.content));
  }

  async handle(event: Electron.IpcMainInvokeEvent, query: KeyboardModeQuery): Promise<IReportKeyboardModeMsg | undefined> {
    const deviceId = query?.device_id;

    if (deviceId) {
      return this._modeByDevice.get(deviceId);
    }

    const first = this._modeByDevice.values().next();
    return first.done ? undefined : first.value;
  }

  update(data: IEventMsg): void {
    const messageType = Number(data.content.message_type);
    if (messageType !== MsgTypeValue.REPORT_KEYBOARD_MODE) return;

    const msg = data.content as Partial<IReportKeyboardModeMsg>;
    if (!msg.device_id || (msg.mode !== "physical" && msg.mode !== "virtual")) {
      this._logger?.warn(`Malformed keyboard mode report: ${JSON.stringify(data.content)}`);
      return;
    }

    const normalized: IReportKeyboardModeMsg = {
      message_id: String(msg.message_id ?? data.id),
      message_type: MsgTypeValue.REPORT_KEYBOARD_MODE,
      device_id: String(msg.device_id),
      mode: msg.mode,
    };

    this._modeByDevice.set(normalized.device_id, normalized);
    this.sendMsgToTargetWindow(normalized);
  }
}

export const keyboardModeController = new KeyboardModeController();
