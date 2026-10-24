import { DeviceClock } from "../domain/DeviceClock";
import { RelayBank } from "../domain/RelayBank";
import { SeenDispenser } from "../domain/SeenDispenser";
import { VirtualButtonJob } from "../domain/VirtualButtonJob";
import { KeyboardMode } from "../domain/values/KeyboardMode";
import { SeenDeviceLink } from "../infrastructure/SeenDeviceLink";

/**
 * The slice of the running simulator that use-cases and emitters need. Keeps
 * them decoupled from {@link SeenDeviceSimulator}'s lifecycle wiring.
 */
export interface ISimRuntime {
  readonly link: SeenDeviceLink;
  readonly clock: DeviceClock;
  readonly dispenser: SeenDispenser;
  readonly job: VirtualButtonJob;
  readonly relays: RelayBank;

  currentMode(): KeyboardMode;
  /** Flip the CPLD mux + persist + notify observers. */
  applyMode(mode: KeyboardMode): void;
}
