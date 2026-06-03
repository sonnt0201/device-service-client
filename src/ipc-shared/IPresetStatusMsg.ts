export type PresetRequestStatus = "received" | "busy" | "error" | "done";

/**
 * Status response for Request Preset sent by Device Service.
 */
export interface IPresetStatusMsg {
  message_id: string;
  status: PresetRequestStatus;
  meta?: string;
  device_id?: string;
}
