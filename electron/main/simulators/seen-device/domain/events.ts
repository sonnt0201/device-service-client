import { ButtonId } from "./values/ButtonId";
import { PresetKind } from "./values/PresetKind";
import { ScreenText } from "./values/ScreenText";

/**
 * Domain events raised by {@link SeenDispenser}. The application layer's emitters
 * subscribe to these and turn them into outbound device frames — no machine
 * rules leak upward.
 */
export type SeenDomainEvent =
  | { type: "screen-changed"; text: ScreenText }
  | { type: "buttons-pressed"; ids: ButtonId[]; timestampMs: number }
  | { type: "preset-entered"; kind: PresetKind; value: string; timestampMs: number }
  | { type: "pump-started"; timestampMs: number }
  | { type: "pump-progressed"; cost: number; volume: number; price: number }
  | { type: "sale-completed"; cost: number; volume: number; price: number; timestampMs: number }
  | { type: "machine-errored"; code: string; timestampMs: number };

/** Why the virtual keypress scheduler refused / failed a job. */
export enum JobRejection {
  NONE = 0,
  BUSY = 1,
  WRONG_MODE = 2,
  INVALID_ARG = 3,
  EXECUTION_ERROR = 4,
}

/** Events from {@link VirtualButtonJob}. */
export type VirtualJobEvent =
  | { type: "button-emitted"; id: number }
  | { type: "completed" }
  | { type: "failed"; reason: JobRejection };
