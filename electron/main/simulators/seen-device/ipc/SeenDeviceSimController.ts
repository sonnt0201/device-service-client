import { IPCControllerBaseV2 } from "../../../shared/ipc/IPCControllerBaseV2";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { IObserver } from "../../../shared/events/IObserver";
import { ITcpRawLog, TcpRawLogBus } from "../../../platform/diagnostics/TcpRawLogBus";
import {
  ISeenSimFrameLog,
  ISeenSimSnapshot,
  SEEN_SIM_CHANNEL,
  SEEN_SIM_FRAME_CHANNEL,
  SeenSimCommand,
} from "@/ipc-shared/seen-sim/SeenSimContracts";
import { seenDeviceSimulator } from "../application/SeenDeviceSimulator";

/**
 * Bridges the SEEN simulator window to {@link seenDeviceSimulator}.
 *
 * - `on` — a {@link SeenSimCommand} from the window (connect, key press, nozzle…).
 * - `handle` — initial snapshot fetch.
 * - `update` — pushes every {@link ISeenSimSnapshot} change to the window.
 */
class SeenDeviceSimController
  extends IPCControllerBaseV2<SeenSimCommand, ISeenSimSnapshot>
  implements IObserver<ISeenSimSnapshot>
{
  _logger: IMainLogger | undefined = new MainLogger("SeenDeviceSimController");

  constructor() {
    super();
    seenDeviceSimulator.changes.subcribe(this);
  }

  channel(): string {
    return SEEN_SIM_CHANNEL;
  }

  on(_event: Electron.IpcMainEvent, message: SeenSimCommand): void {
    seenDeviceSimulator.dispatch(message);
  }

  async handle(): Promise<ISeenSimSnapshot> {
    return seenDeviceSimulator.snapshot();
  }

  update(snapshot: ISeenSimSnapshot): void {
    this.sendMsgToTargetWindow(snapshot);
  }
}

/**
 * Forwards the `source: "device"` raw TCP frames (the sim's link to Device
 * Service) to the simulator window. Sibling of `TcpRawLogController`, scoped to
 * this one source so the sim window's log stays clean.
 */
class SeenDeviceSimLogController
  extends IPCControllerBaseV2<never, ITcpRawLog>
  implements IObserver<ITcpRawLog>
{
  _logger: IMainLogger | undefined = new MainLogger("SeenDeviceSimLogController");

  constructor() {
    super();
    TcpRawLogBus.getInstance().subcribe(this);
  }

  channel(): string {
    return "seen-device-sim-log";
  }

  update(data: ITcpRawLog): void {
    if (data.source !== "device") return;
    this.sendMsgToTargetWindow(data);
  }
}

/**
 * Streams one {@link ISeenSimFrameLog} per framed packet on the sim's link to
 * Device Service (both directions) to the simulator window. Feeds the log
 * window and its packet inspector.
 */
class SeenDeviceSimFrameLogController
  extends IPCControllerBaseV2<never, ISeenSimFrameLog>
  implements IObserver<ISeenSimFrameLog>
{
  _logger: IMainLogger | undefined = new MainLogger("SeenDeviceSimFrameLogController");

  constructor() {
    super();
    seenDeviceSimulator.link.frameLog.subcribe(this);
  }

  channel(): string {
    return SEEN_SIM_FRAME_CHANNEL;
  }

  update(data: ISeenSimFrameLog): void {
    this.sendMsgToTargetWindow(data);
  }
}

export const seenDeviceSimController = new SeenDeviceSimController();
export const seenDeviceSimLogController = new SeenDeviceSimLogController();
export const seenDeviceSimFrameLogController = new SeenDeviceSimFrameLogController();
