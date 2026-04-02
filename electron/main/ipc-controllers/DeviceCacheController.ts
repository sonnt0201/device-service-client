import { IDeviceServiceDevice } from "../../../src/ipc-shared/IDeviceServiceDevice";
import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { IObserver } from "../base/IObserver";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";

class DeviceCacheController extends IPCControllerBaseV2<void, IDeviceServiceDevice[]>
  implements IObserver<IEventMsg> {
  _logger: IMainLogger | undefined = new MainLogger("DeviceCacheController");

  private _deviceMap = new Map<string, IDeviceServiceDevice>();
  private _eventExchangeDSListener = EventExchangeDSListener.getInstance();

  constructor() {
    super();
    this._eventExchangeDSListener.eventMsgNotifier.subcribe(this);
  }

  channel(): string {
    return "devices";
  }

  async handle(): Promise<IDeviceServiceDevice[]> {
    return this.getDevicesSnapshot();
  }

  update(data: IEventMsg): void {
    if (data.content.message_type !== MsgTypeValue.GET_DEVICES) return;

    const maybeDevice = data.content as Partial<IDeviceServiceDevice>;

    if (!maybeDevice.device_id) {
      this._logger?.warn(`Skip malformed device message: ${JSON.stringify(data.content)}`);
      return;
    }

    const device: IDeviceServiceDevice = {
      connection_state: Boolean(maybeDevice.connection_state),
      device_id: String(maybeDevice.device_id),
      device_type: Number(maybeDevice.device_type ?? 0),
      firm_version: Number(maybeDevice.firm_version ?? 0),
      message_id: String(maybeDevice.message_id ?? data.id),
      message_type: MsgTypeValue.GET_DEVICES,
      updated_at: Number(maybeDevice.updated_at ?? Date.now()),
    };

    this._deviceMap.set(device.device_id, device);

    this.sendMsgToTargetWindow(this.getDevicesSnapshot());
  }

  private getDevicesSnapshot(): IDeviceServiceDevice[] {
    return Array.from(this._deviceMap.values()).sort((a, b) => {
      if (a.connection_state !== b.connection_state) {
        return a.connection_state ? -1 : 1;
      }
      return b.updated_at - a.updated_at;
    });
  }
}

export const deviceCacheController = new DeviceCacheController();
