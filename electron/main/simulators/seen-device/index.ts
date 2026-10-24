/**
 * SEEN keyboard device simulator.
 *
 * Stands in for the STM32 firmware + dispenser hardware (`../LogiProj_DeviceV2`,
 * `DEV_TYPE == SEEN_DEV`). Connects to Device Service as a TCP client on port
 * 5000 and speaks the binary 12-byte-header protocol — handshake, time-sync,
 * ping, relay, keyboard mode, virtual-button jobs, keyboard screen stream,
 * button reports, user-operation events. OTA is out of scope.
 *
 * Layered like `contexts/keyboard/`: rich `domain`, thin `application`
 * use-cases + emitters, `infrastructure` wire adapters, `ipc` window bridge.
 */
export { seenDeviceSimulator } from "./application/SeenDeviceSimulator";
export {
  seenDeviceSimController,
  seenDeviceSimLogController,
  seenDeviceSimFrameLogController,
} from "./ipc/SeenDeviceSimController";
