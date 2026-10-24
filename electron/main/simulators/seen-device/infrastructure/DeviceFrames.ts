import {
  FIRMWARE_VERSION,
  KEYBOARD_TEXT_LENGTH,
  SEEN_DEVICE_TYPE,
  TOTAL_RELAY,
} from "./protocol";

/** ASCII bytes of `text`, truncated to `width`, then NUL-padded to `width`. */
function asciiFixed(text: string, width: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < width; i++) {
    out.push(i < text.length ? text.charCodeAt(i) & 0x7f : 0x00);
  }
  return out;
}

/**
 * Outbound device payload builders (the `Device -> DS` direction).
 *
 * Layouts follow `../LogiProj_DeviceV2/App/Control/Keyboard/KeyboardController.c`
 * and `App/Control/Timestamp/*`, cross-checked against the DS parsers in
 * `../device-service/NetworkBLG/KeyboardController.cpp`.
 */
export const DeviceFrames = {
  /** `CMD 0x01` payload: `[DevType H,L][TotalRelay][FirmVer H,L]`. */
  handshake(): number[] {
    return [
      (SEEN_DEVICE_TYPE >> 8) & 0xff,
      SEEN_DEVICE_TYPE & 0xff,
      TOTAL_RELAY,
      (FIRMWARE_VERSION >> 8) & 0xff,
      FIRMWARE_VERSION & 0xff,
    ];
  },

  /** `CMD 0x11`: one mode byte (0 physical / 1 virtual). */
  reportMode(modeByte: number): number[] {
    return [modeByte & 0xff];
  },

  /** `CMD 0x03`: one byte per relay. */
  reportRelays(states: readonly number[]): number[] {
    return states.map((s) => (s ? 1 : 0));
  },

  /** `CMD 0x06` echo: no payload. */
  keepAlive(): number[] {
    return [];
  },

  /**
   * `CMD 0x12`: `[frameCount][textLength]` then per frame
   * `[8B ts MSB->LSB][16B text][0x00]`.
   */
  streamKeyboardScreen(frames: { timestampBytes: number[]; text: string }[]): number[] {
    const out: number[] = [frames.length & 0xff, KEYBOARD_TEXT_LENGTH];
    for (const f of frames) {
      out.push(...f.timestampBytes.slice(0, 8));
      out.push(...asciiFixed(f.text, KEYBOARD_TEXT_LENGTH));
      out.push(0x00);
    }
    return out;
  },

  /**
   * `CMD 0x17`: repeated `[count][8B ts][count ids][0x00]` frames.
   */
  reportButtons(frames: { timestampBytes: number[]; ids: number[] }[]): number[] {
    const out: number[] = [];
    for (const f of frames) {
      out.push(f.ids.length & 0xff);
      out.push(...f.timestampBytes.slice(0, 8));
      for (const id of f.ids) out.push(id & 0xff);
      out.push(0x00);
    }
    return out;
  },

  /** `CMD 0x13`: `[kind][8B ts][value ascii][0x00]`. */
  reportUserOperation(kind: number, timestampBytes: number[], value: string): number[] {
    const out: number[] = [kind & 0xff, ...timestampBytes.slice(0, 8)];
    for (let i = 0; i < value.length; i++) out.push(value.charCodeAt(i) & 0x7f);
    out.push(0x00);
    return out;
  },

  /** `CMD 0x15`: `[status][meta ascii][0x00]` (`DeviceMessage_SetAsStatus`). */
  status(statusCode: number, meta = ""): number[] {
    const out: number[] = [statusCode & 0xff];
    for (let i = 0; i < meta.length; i++) out.push(meta.charCodeAt(i) & 0x7f);
    out.push(0x00);
    return out;
  },
} as const;
