import { JobRejection } from "../domain/events";
import { StatusCode } from "../infrastructure/protocol";

/**
 * `JobRejection` -> `CMD 0x15` status code + default meta.
 *
 * Same mapping as `KeyboardController.c` (`ReturnCode -> StatusCode`): a wrong
 * mode / bad argument is an *invalid request* (Logi status 1), a failed screen
 * verify is an *execution error* (Logi status 4).
 */
export function rejectionToStatus(reason: JobRejection): { code: StatusCode; meta: string } {
  switch (reason) {
    case JobRejection.BUSY:
      return { code: StatusCode.KEYBOARD_BUSY, meta: "Busy for another operation" };
    case JobRejection.WRONG_MODE:
      return { code: StatusCode.KEYBOARD_INVALID_REQUEST, meta: "Error: keyboard is in manual mode" };
    case JobRejection.INVALID_ARG:
      return { code: StatusCode.KEYBOARD_INVALID_REQUEST, meta: "Error: invalid request" };
    case JobRejection.EXECUTION_ERROR:
      return { code: StatusCode.KEYBOARD_EXECUTION_ERROR, meta: "Error: screen did not match" };
    case JobRejection.NONE:
    default:
      return { code: StatusCode.KEYBOARD_RECEIVED, meta: "" };
  }
}
