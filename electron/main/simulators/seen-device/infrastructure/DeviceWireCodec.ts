import { HEADER_SIZE, RxFrame } from "./protocol";

/**
 * The 12-byte frame header shared by every device <-> DS packet:
 *
 * `[len H][len L][MAC5..MAC0][CMD][rsv][rsv][rsv][payload…]`
 *
 * `len` is the payload length (header excluded), big-endian. MAC is MSB -> LSB.
 * Encode side mirrors `DeviceServiceMiddleware_SendPacket`; decode side is the
 * byte-at-a-time state machine of `_doParseRxPacket`, collapsed to a buffered
 * parser since Node hands us whole chunks.
 */
export class DeviceWireCodec {
  static encode(mac: readonly number[], cmd: number, payload: readonly number[] = []): Buffer {
    const len = payload.length;
    const head = [
      (len >> 8) & 0xff,
      len & 0xff,
      ...mac.slice(0, 6),
      cmd & 0xff,
      0x00,
      0x00,
      0x00,
    ];
    return Buffer.from([...head, ...payload]);
  }
}

/**
 * Reassembles inbound frames from a TCP byte stream.
 */
export class RxFrameParser {
  private _buf = Buffer.alloc(0);

  /** Feed a socket chunk; returns every complete frame it now contains. */
  push(chunk: Buffer): RxFrame[] {
    this._buf =
      this._buf.length === 0 ? Buffer.from(chunk) : Buffer.concat([this._buf, chunk]);
    const frames: RxFrame[] = [];

    while (this._buf.length >= HEADER_SIZE) {
      const len = (this._buf[0] << 8) | this._buf[1];
      const total = HEADER_SIZE + len;
      if (this._buf.length < total) break;

      const mac = Array.from(this._buf.subarray(2, 8));
      const cmd = this._buf[8];
      const payload = Array.from(this._buf.subarray(HEADER_SIZE, total));
      frames.push({ cmd, mac, payload });

      this._buf = Buffer.from(this._buf.subarray(total));
    }

    return frames;
  }

  reset(): void {
    this._buf = Buffer.alloc(0);
  }
}
