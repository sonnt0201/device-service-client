import { Socket } from "net";
import * as tls from "tls";
import { Observable } from "../../../shared/events/Observable";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { TcpRawLogBus } from "../../../platform/diagnostics/TcpRawLogBus";
import { ISeenSimFrameLog } from "@/ipc-shared/seen-sim/SeenSimContracts";
import { MacAddress } from "../domain/values/MacAddress";
import { DeviceWireCodec, RxFrameParser } from "./DeviceWireCodec";
import { Cmd, DEVICE_SERVICE_PORT, HEADER_SIZE, RxFrame } from "./protocol";

let _frameSeq = 0;

export type LinkState = "idle" | "connecting" | "connected";

export interface LinkStatusEvent {
  state: LinkState;
  detail?: string;
}

/**
 * TCP client to Device Service (port 5000), speaking the binary 12-byte-header
 * protocol as the real board would.
 *
 * **TLS by default.** Device Service's device-side `Connection` always runs a
 * TLS server handshake once `sslcred.dll` is present — regardless of the
 * `config.json` `"tls"` flag (that flag only gates UDP discovery and the
 * Logi->device direction). The real SEEN firmware connects over TLS too
 * (`wiz_tls_*` in `../LogiProj_DeviceV2/App/Gateway/InternetService.c`). A plain
 * TCP connection makes DS's handshake fail silently, drop the socket, and — with
 * no device registered — restart the whole acceptor every second (`ECONNRESET`
 * loop). We present no client certificate and skip server-cert validation, and
 * we relax the OpenSSL security level so a legacy DS cert / DH params still
 * negotiate.
 *
 * Auto-reconnects while `start()`ed. Every frame is mirrored to the shared
 * {@link TcpRawLogBus} as `source: "device"` and to {@link frameLog}.
 */
export class SeenDeviceLink {
  readonly frames = new Observable<RxFrame>();
  readonly status = new Observable<LinkStatusEvent>();
  /** One structured entry per frame sent or received, for the log window. */
  readonly frameLog = new Observable<ISeenSimFrameLog>();

  private readonly _logger: IMainLogger = new MainLogger("SeenDeviceLink");
  private readonly _rawLog = TcpRawLogBus.getInstance();
  private readonly _parser = new RxFrameParser();

  private _socket: Socket | null = null;
  private _mac: MacAddress | null = null;
  private _host = "localhost";
  private _port = DEVICE_SERVICE_PORT;
  private _tls = true;
  private _wantConnected = false;
  private _reconnectTimer: NodeJS.Timeout | null = null;
  private _state: LinkState = "idle";

  get state(): LinkState {
    return this._state;
  }

  get mac(): MacAddress | null {
    return this._mac;
  }

  get usesTls(): boolean {
    return this._tls;
  }

  start(mac: MacAddress, host: string, port: number, useTls = true): void {
    this._mac = mac;
    this._host = host || "localhost";
    this._port = port || DEVICE_SERVICE_PORT;
    this._tls = useTls;
    this._wantConnected = true;
    this._openSocket();
  }

  stop(): void {
    this._wantConnected = false;
    this._clearReconnect();
    this._teardownSocket("stopped by user");
    this._setState("idle");
  }

  /** Send one framed packet. No-op (logged) when the socket is down. */
  send(cmd: number, payload: readonly number[] = []): void {
    if (!this._socket || this._socket.destroyed || !this._mac) {
      this._logger.warn(`drop TX cmd=0x${cmd.toString(16)} — link down`);
      return;
    }
    const frame = DeviceWireCodec.encode(this._mac.bytes, cmd, payload);
    this._socket.write(frame);
    this._publishRaw("send", cmd, frame);
    this._publishFrame("send", cmd, frame);
  }

  private _openSocket(): void {
    this._clearReconnect();
    this._teardownSocket("reconnecting");
    this._parser.reset();
    this._setState("connecting");

    let socket: Socket;
    try {
      socket = this._tls
        ? tls.connect({
            host: this._host,
            port: this._port,
            // DS presents a legacy self-signed cert; the device never validates
            // it (mirrors `sim_dev_zcheng.py` CERT_NONE and the firmware's
            // `wiz_tls_*`). Widen the version floor for an older DS build.
            rejectUnauthorized: false,
            minVersion: "TLSv1",
          })
        : new Socket();
    } catch (err) {
      this._logger.error(`cannot open socket: ${(err as Error).message}`);
      this._setState("connecting", (err as Error).message);
      this._scheduleReconnect();
      return;
    }
    this._socket = socket;

    const onUp = () => {
      this._setState("connected");
      this._logger.success(
        `${this._tls ? "TLS " : ""}connected to ${this._host}:${this._port}`,
      );
    };
    socket.on("connect", () => {
      if (!this._tls) onUp();
    });
    socket.on("secureConnect", onUp);

    socket.on("data", (chunk: Buffer) => {
      for (const frame of this._parser.push(chunk)) {
        const encoded = DeviceWireCodec.encode(frame.mac, frame.cmd, frame.payload);
        this._publishRaw("recv", frame.cmd, encoded);
        this._publishFrame("recv", frame.cmd, encoded);
        this.frames.notify(frame);
      }
    });

    socket.on("error", (err) => {
      this._logger.error(`socket error: ${err.message}`);
    });

    socket.on("close", () => {
      if (this._state !== "idle") this._setState("connecting", "disconnected");
      this._scheduleReconnect();
    });

    if (!this._tls) {
      (socket as Socket).connect(this._port, this._host);
    }
  }

  private _teardownSocket(reason: string): void {
    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket.destroy();
      this._socket = null;
      this._logger.warn(`socket down: ${reason}`);
    }
  }

  private _scheduleReconnect(): void {
    if (!this._wantConnected || this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      if (this._wantConnected) this._openSocket();
    }, 2000);
  }

  private _clearReconnect(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  private _setState(state: LinkState, detail?: string): void {
    this._state = state;
    this.status.notify({ state, detail });
  }

  private _publishRaw(direction: "send" | "recv", cmd: number, frame: Buffer): void {
    const name = Cmd[cmd] ?? "UNKNOWN";
    this._rawLog.notify({
      direction,
      source: "device",
      payload: `[0x${cmd.toString(16).padStart(2, "0")} ${name}] ${frame.toString("hex")}`,
    });
  }

  private _publishFrame(direction: "send" | "recv", cmd: number, frame: Buffer): void {
    this.frameLog.notify({
      seq: ++_frameSeq,
      at: Date.now(),
      direction,
      cmd,
      cmdName: Cmd[cmd] ?? "UNKNOWN",
      bytesHex: frame.toString("hex"),
      headerLen: HEADER_SIZE,
      payloadLen: Math.max(0, frame.length - HEADER_SIZE),
    });
  }
}
