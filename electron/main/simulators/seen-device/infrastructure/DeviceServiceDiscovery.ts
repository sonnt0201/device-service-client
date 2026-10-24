import dgram from "dgram";
import { Observable } from "../../../shared/events/Observable";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { DEVICE_SERVICE_UDP_PORT } from "./protocol";

export interface DiscoveredService {
  /** Source IP of the beacon — the Device Service host. */
  host: string;
  /** Device Service TCP port carried in the beacon (normally 5000). */
  port: number;
}

/**
 * Returns the TCP port from the first `'A''A''A''A' ?? 'A''A'` marker in `buf`
 * (port big-endian at marker + 4), or `null` if there is no valid marker.
 */
export function parseDiscoveryBeacon(buf: Buffer): number | null {
  const A = 0x41; // 'A'
  for (let i = 0; i + 8 <= buf.length; i++) {
    if (
      buf[i] === A &&
      buf[i + 1] === A &&
      buf[i + 2] === A &&
      buf[i + 3] === A &&
      buf[i + 6] === A &&
      buf[i + 7] === A
    ) {
      const port = (buf[i + 4] << 8) | buf[i + 5];
      if (port > 0 && port <= 0xffff) return port;
    }
  }
  return null;
}

/**
 * Listens for the Device Service UDP discovery beacon and reports the host and
 * TCP port it carries. This is the simulator standing in for the firmware's
 * `_findStationInfo()` (`../LogiProj_DeviceV2/App/Gateway/InternetService.c`).
 *
 * Beacon layout (8 bytes, sent by `udpbroadcast()` in
 * `../device-service/NetworkBLG/main.cpp`, only while `"tls": false`):
 *
 * `[ 'A' 'A' 'A' 'A' ][ portHi portLo ][ 'A' 'A' ]`  — port is big-endian.
 */
export class DeviceServiceDiscovery {
  readonly discovered = new Observable<DiscoveredService>();
  /** Fires with a reason when the listener could not be started or died. */
  readonly failed = new Observable<string>();

  private readonly _logger: IMainLogger = new MainLogger("DeviceServiceDiscovery");
  private _socket: dgram.Socket | null = null;

  get running(): boolean {
    return this._socket !== null;
  }

  /** Bind the UDP port and start reporting beacons. Idempotent. */
  start(): void {
    if (this._socket) return;

    const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
    this._socket = socket;

    socket.on("message", (msg, rinfo) => {
      const port = parseDiscoveryBeacon(msg);
      if (port === null) return;
      this._logger.success(`beacon from ${rinfo.address} -> Device Service tcp/${port}`);
      this.discovered.notify({ host: rinfo.address, port });
    });

    socket.on("error", (err) => {
      this._logger.error(`udp discovery error: ${err.message}`);
      this.stop();
      this.failed.notify(err.message);
    });

    socket.bind(DEVICE_SERVICE_UDP_PORT, () => {
      try {
        socket.setBroadcast(true);
      } catch {
        /* not fatal — some stacks reject setBroadcast on a bound recv socket */
      }
      this._logger.log(`listening for Device Service beacons on udp/${DEVICE_SERVICE_UDP_PORT}`);
    });
  }

  /** Close the socket. Idempotent. */
  stop(): void {
    if (!this._socket) return;
    try {
      this._socket.removeAllListeners();
      this._socket.close();
    } catch {
      /* already closing */
    }
    this._socket = null;
  }

}
