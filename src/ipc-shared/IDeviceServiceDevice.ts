import { MsgTypeValue } from "./MessageType";

/**
 * Device entry from Device Service message_type = 8.
 */
export interface IDeviceServiceDevice {
  connection_state: boolean;
  device_id: string;
  device_type: number;
  firm_version: number;
  message_id: string;
  message_type: MsgTypeValue.GET_DEVICES;
  updated_at: number;
}
