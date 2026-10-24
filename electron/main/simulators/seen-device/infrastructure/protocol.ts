/**
 * SEEN device <-> Device Service binary wire constants.
 *
 * Mirror of `../LogiProj_DeviceV2/App/Gateway/Protocol.h` and
 * `../device-service/NetworkBLG/Protocol.h` (the two are hand-kept copies).
 * Numbering is positional and deployed — append, never renumber.
 */

export enum Cmd {
  HANDSHAKE = 0x01,
  SCREEN_STREAM = 0x02, // dispenser column screen (phase 2)
  RELAY_REPORT = 0x03,
  SET_RELAY = 0x04,
  TIME_SYNC = 0x05,
  KEEP_ALIVE = 0x06,
  OTA_START = 0x07,
  OTA_SEND_FILE = 0x08,
  OTA_ACTIVATE = 0x09,
  OTA_RESP = 0x0a,
  ECHO = 0x0f,
  KEYBOARD_SET_MODE = 0x10,
  KEYBOARD_REPORT_MODE = 0x11,
  KEYBOARD_STREAM_KBSCREEN = 0x12,
  KEYBOARD_REPORT_USER_OPERATION = 0x13,
  KEYBOARD_PRESS_VIRTUAL_BUTTONS = 0x14,
  KEYBOARD_COMMON_STATUS_CODE = 0x15,
  KEYBOARD_REQUEST_USER_OPERATION = 0x16,
  KEYBOARD_REPORT_BUTTONS_PRESSED = 0x17,
  KEYBOARD_STOP_PUMPING = 0x18,
}

export enum StatusCode {
  NULL = 0,
  DONE = 1,
  UNKNOWN_ERROR = 2,
  KEYBOARD_RECEIVED = 10,
  KEYBOARD_BUSY = 11,
  KEYBOARD_DONE = 12,
  KEYBOARD_ERROR = 13,
  KEYBOARD_INVALID_REQUEST = 14,
  KEYBOARD_EXECUTION_ERROR = 15,
}

/** SEEN, per `../device-service` doc drift note (`0x0003`, not `0x0004`). */
export const SEEN_DEVICE_TYPE = 0x0003;
export const FIRMWARE_VERSION = 0x0002;
export const TOTAL_RELAY = 2;

/** Decoded keyboard text length for SEEN (`KBSCREEN_DECCODED_TEXT_LENGTH`). */
export const KEYBOARD_TEXT_LENGTH = 16;

export const HEADER_SIZE = 12;
export const DEVICE_SERVICE_PORT = 5000;

/**
 * UDP port the Device Service broadcasts its discovery beacon to (mirror of
 * firmware `UDP_PORT` in `../LogiProj_DeviceV2/App/Gateway/InternetService.h`).
 * The beacon is 8 bytes: `'A''A''A''A' <portHi> <portLo> 'A''A'`, where the
 * two middle bytes are the Device Service TCP port, big-endian. The broadcast
 * only runs while the Device Service has `"tls": false`.
 */
export const DEVICE_SERVICE_UDP_PORT = 5001;

export interface RxFrame {
  cmd: number;
  mac: number[];
  payload: number[];
}
