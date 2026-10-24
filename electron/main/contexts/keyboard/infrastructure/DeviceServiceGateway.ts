import { IEventMsg } from "@/ipc-shared/IEventMsg";
import { IObserver } from "../../../shared/events/IObserver";
import { EventExchangeDSListener } from "../../../platform/device-service/EventExchangeDSListener";

/**
 * Cổng ra Device Service cho context bàn phím.
 *
 * Bọc {@link EventExchangeDSListener} singleton để tầng application không phải biết chuyện
 * transport: nó chỉ `send(payload)` và `subscribe(observer)`, không đụng tới JSON hay
 * hình dạng `IEventMsg`.
 *
 * [Singleton Design Pattern] — giữ nguyên như trước, chỉ là một lớp mỏng phía trên.
 */
export class DeviceServiceGateway {
  private static _instance: DeviceServiceGateway;

  private readonly _listener = EventExchangeDSListener.getInstance();

  public static getInstance(): DeviceServiceGateway {
    if (!DeviceServiceGateway._instance) {
      DeviceServiceGateway._instance = new DeviceServiceGateway();
    }
    return DeviceServiceGateway._instance;
  }

  /** Device Service đã mở kết nối lắng nghe chưa. */
  get isListening(): boolean {
    return this._listener.startListening;
  }

  /** Đăng ký nghe luồng sự kiện đến từ Device Service. */
  subscribe(observer: IObserver<IEventMsg>): void {
    this._listener.eventMsgNotifier.subcribe(observer);
  }

  /** Gửi một message tới Device Service (tự `JSON.stringify`). */
  send(payload: unknown): void {
    this._listener.send(JSON.stringify(payload));
  }
}
