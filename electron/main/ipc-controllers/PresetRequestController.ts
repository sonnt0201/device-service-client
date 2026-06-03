import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import { ISetPresetMsg } from "../../../src/ipc-shared/ISetPresetMsg";
import { IPresetStatusMsg, PresetRequestStatus } from "../../../src/ipc-shared/IPresetStatusMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { IObserver } from "../base/IObserver";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";

class PresetRequestController
  extends IPCControllerBaseV2<ISetPresetMsg, IPresetStatusMsg>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("PresetRequestController");

  private _eventExchangeDSListener = EventExchangeDSListener.getInstance();
  private _pendingRequests = new Map<string, { deviceId: string; createdAt: number }>();

  constructor() {
    super();
    this._eventExchangeDSListener.eventMsgNotifier.subcribe(this);
  }

  channel(): string {
    return "preset-request";
  }

  on(event: Electron.CrossProcessExports.IpcMainEvent, message: ISetPresetMsg): void {
    if (!this._eventExchangeDSListener.startListening) return;

    if (message.message_type !== MsgTypeValue.REQUEST_PRESET) {
      this._logger?.warn(`Unsupported preset request type: ${message.message_type}`);
      return;
    }

    if (!message.device_id) {
      this._logger?.warn("Preset request missing device_id.");
      return;
    }

    const hasCost = Number.isFinite(message.pre_cost);
    const hasVolume = Number.isFinite(message.pre_volume);
    if (!hasCost && !hasVolume) {
      this._logger?.warn("Preset request missing pre_cost or pre_volume.");
      return;
    }

    this._pendingRequests.set(message.message_id, {
      deviceId: message.device_id,
      createdAt: Date.now(),
    });

    const msgToSendDS: IEventMsg = {
      id: message.message_id,
      content: message,
    };

    this._eventExchangeDSListener.send(JSON.stringify(msgToSendDS.content));
  }

  update(data: IEventMsg): void {
    const content = data.content as Partial<IPresetStatusMsg> & { status?: string };

    if (!content?.message_id || !content.status) return;

    if (!this.isPresetStatus(content.status)) return;

    const messageId = String(content.message_id);
    const pending = this._pendingRequests.get(messageId);

    const normalized: IPresetStatusMsg = {
      message_id: messageId,
      status: content.status,
      meta: content.meta ? String(content.meta) : undefined,
      device_id: content.device_id ? String(content.device_id) : pending?.deviceId,
    };

    if (normalized.status !== "received") {
      this._pendingRequests.delete(messageId);
    }

    this.sendMsgToTargetWindow(normalized);
  }

  private isPresetStatus(status: string): status is PresetRequestStatus {
    return status === "received" || status === "busy" || status === "error" || status === "done";
  }
}

export const presetRequestController = new PresetRequestController();
