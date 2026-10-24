/**
 * @file Keyboard context composition.
 *
 * Instantiates the use-cases / projections once (they hold no per-window state) and
 * exposes them as a single object the thin IPC controllers delegate to. The underlying
 * Device-Service listener and the request registry are still `getInstance()` singletons.
 */
import { ButtonsPressedProjection } from "./application/ButtonsPressedProjection";
import { DetectorStateProjection } from "./application/DetectorStateProjection";
import { KeyboardModeProjection } from "./application/KeyboardModeProjection";
import { PresetEventProjection } from "./application/PresetEventProjection";
import { PressVirtualButtonsUseCase } from "./application/PressVirtualButtonsUseCase";
import { RequestPresetSaleUseCase } from "./application/RequestPresetSaleUseCase";
import { SetKeyboardModeUseCase } from "./application/SetKeyboardModeUseCase";
import { StopBumpUseCase } from "./application/StopBumpUseCase";

export const keyboard = {
  setMode: new SetKeyboardModeUseCase(),
  pressButtons: new PressVirtualButtonsUseCase(),
  requestPreset: new RequestPresetSaleUseCase(),
  stopBump: new StopBumpUseCase(),
  modeProjection: new KeyboardModeProjection(),
  buttonsPressed: new ButtonsPressedProjection(),
  presetEvents: new PresetEventProjection(),
  detectorState: new DetectorStateProjection(),
} as const;
