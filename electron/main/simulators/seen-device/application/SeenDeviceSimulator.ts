import { Observable } from "../../../shared/events/Observable";
import { IMainLogger } from "../../../shared/logging/IMainLog";
import { MainLogger } from "../../../shared/logging/MainLog";
import { ISeenSimSnapshot, SeenSimCommand } from "@/ipc-shared/seen-sim/SeenSimContracts";
import { DeviceClock } from "../domain/DeviceClock";
import { RelayBank } from "../domain/RelayBank";
import { SeenDispenser } from "../domain/SeenDispenser";
import { VirtualButtonJob } from "../domain/VirtualButtonJob";
import { ButtonId, ButtonIds } from "../domain/values/ButtonId";
import { KeyboardMode } from "../domain/values/KeyboardMode";
import { MacAddress } from "../domain/values/MacAddress";
import { DeviceFrames } from "../infrastructure/DeviceFrames";
import { DeviceServiceDiscovery } from "../infrastructure/DeviceServiceDiscovery";
import { SeenDeviceLink } from "../infrastructure/SeenDeviceLink";
import { Cmd, DEVICE_SERVICE_PORT, RxFrame } from "../infrastructure/protocol";
import { ISimRuntime } from "./ISimRuntime";
import { OutboundEmitters } from "./emitters/OutboundEmitters";
import { PressVirtualButtons, RequestUserOperation, StopPumping } from "./usecases/JobCommands";
import { SystemCommands } from "./usecases/SystemCommands";

const LOOP_INTERVAL_MS = 50;

/**
 * Composition root and lifecycle owner for the SEEN device simulator.
 *
 * Wires the rich domain (`SeenDispenser`, `VirtualButtonJob`, `RelayBank`,
 * `DeviceClock`) to the binary link, routes inbound frames to one-per-CMD
 * use-cases, and pumps `tick()` / `job.advance()`. Holds no machine rules of its
 * own — mode gating is the one exception (the mux is a device-level concern, not
 * a dispenser one).
 *
 * Single instance; the IPC controller drives it and forwards {@link changes}.
 */
export class SeenDeviceSimulator implements ISimRuntime {
  readonly changes = new Observable<ISeenSimSnapshot>();

  readonly link = new SeenDeviceLink();
  readonly discovery = new DeviceServiceDiscovery();
  readonly clock = new DeviceClock();
  readonly dispenser = new SeenDispenser(this.clock);
  readonly job = new VirtualButtonJob();
  readonly relays = new RelayBank();

  private readonly _logger: IMainLogger = new MainLogger("SeenDeviceSimulator");
  private readonly _system = new SystemCommands(this);
  private readonly _pressButtons = new PressVirtualButtons(this);
  private readonly _requestOp = new RequestUserOperation(this);
  private readonly _stopPump = new StopPumping(this);

  private _mode: KeyboardMode = KeyboardMode.PHYSICAL;
  private _mac: MacAddress | null = null;
  private _host = "localhost";
  private _port = DEVICE_SERVICE_PORT;
  private _tls = true;
  private _loop: NodeJS.Timeout | null = null;
  private _wasConnected = false;
  private _discovering = false;
  private _discoverySource: string | undefined;

  constructor() {
    // outbound projections subscribe to domain + job events
    new OutboundEmitters(this);

    // virtual job steps drive the keypad
    this.job.events.subcribe({
      update: (e) => {
        if (e.type === "button-emitted" && ButtonIds.isValid(e.id)) {
          this.dispenser.pressKey(e.id as ButtonId);
        }
      },
    });

    // republish on any change
    const publish = { update: () => this._publish() };
    this.dispenser.events.subcribe(publish);
    this.job.events.subcribe(publish);
    this.link.status.subcribe({
      update: (s) => {
        if (s.state === "connected" && !this._wasConnected) this._onConnected();
        if (s.state !== "connected") this._wasConnected = false;
        this._publish();
      },
    });

    this.link.frames.subcribe({ update: (f) => this._route(f) });

    // a discovery beacon -> auto-connect to the address it carries
    this.discovery.discovered.subcribe({
      update: ({ host, port }) => {
        if (!this._discovering || !this._mac) return;
        this._discoverySource = `${host}:${port}`;
        this._logger.success(`discovered Device Service at ${this._discoverySource}, connecting`);
        this._stopDiscovery();
        this.link.start(this._mac, host, port, this._tls);
        this._host = host;
        this._port = port;
        this._startLoop();
        this._publish();
      },
    });

    this.discovery.failed.subcribe({
      update: (reason) => {
        if (!this._discovering) return;
        this._discoverySource = `lỗi khi nghe UDP: ${reason}`;
        this._stopDiscovery();
      },
    });
  }

  // -------------------------------------------------------------- ISimRuntime

  currentMode(): KeyboardMode {
    return this._mode;
  }

  applyMode(mode: KeyboardMode): void {
    if (this._mode.equals(mode)) return;
    this._mode = mode;
    this._logger.log(`mode -> ${mode.name}`);
    this._publish();
  }

  // -------------------------------------------------------------- commands (IPC)

  dispatch(cmd: SeenSimCommand): void {
    switch (cmd.kind) {
      case "connect":
        this._connect(cmd.mac, cmd.host, cmd.port, cmd.tls ?? true);
        break;
      case "discover":
        this._startDiscovery(cmd.mac, cmd.tls ?? true);
        break;
      case "stop-discovery":
        this._stopDiscovery();
        break;
      case "disconnect":
        this._disconnect();
        break;
      case "press-key":
        this._pressPhysicalKey(cmd.buttonId);
        break;
      case "nozzle":
        if (cmd.action === "lift") this.dispenser.liftNozzle();
        else this.dispenser.seatNozzle();
        break;
      case "set-unit-price":
        this.dispenser.configureUnitPrice(cmd.vnd);
        break;
      case "set-flow":
        this.dispenser.configureFlow(cmd.litrePerSecond);
        break;
      case "factory-reset":
        this.dispenser.pressKey(ButtonId.C);
        break;
      case "raise-error":
        this.dispenser.raiseError();
        break;
      case "clear-error":
        this.dispenser.clearError();
        break;
    }
    this._publish();
  }

  snapshot(): ISeenSimSnapshot {
    const d = this.dispenser.snapshot();
    return {
      link: this.link.state,
      mac: this._mac?.toHex() ?? "",
      host: this._host,
      port: this._port,
      tls: this._tls,
      discovering: this._discovering,
      discoverySource: this._discoverySource,
      mode: this._mode.name,
      state: d.state,
      nozzle: d.nozzle,
      unitPrice: d.unitPrice,
      presetKind: d.presetKind,
      presetAmount: d.presetAmount,
      pumpedCost: d.pumpedCost,
      pumpedVolume: d.pumpedVolume,
      screenText: d.screenText,
      clockSynced: d.clockSynced,
      relays: this.relays.snapshot(),
      jobRunning: this.job.isRunning,
    };
  }

  // -------------------------------------------------------------- internals

  private _connect(mac: string, host: string, port: number, useTls: boolean): void {
    try {
      this._mac = MacAddress.parse(mac);
    } catch (err) {
      this._logger.error(`bad MAC: ${(err as Error).message}`);
      return;
    }
    this._stopDiscovery();
    this._tls = useTls;
    this._host = host || "localhost";
    this._port = port || DEVICE_SERVICE_PORT;
    this.link.start(this._mac, this._host, this._port, this._tls);
    this._startLoop();
  }

  private _startDiscovery(mac: string, useTls: boolean): void {
    if (this.link.state !== "idle") {
      this._logger.warn("discover ignored — link is not idle");
      return;
    }
    try {
      this._mac = MacAddress.parse(mac);
    } catch (err) {
      this._logger.error(`bad MAC: ${(err as Error).message}`);
      return;
    }
    this._tls = useTls;
    this._discovering = true;
    this._discoverySource = undefined;
    this.discovery.start();
    this._logger.log("listening for Device Service UDP beacon");
    this._publish();
  }

  private _stopDiscovery(): void {
    if (!this._discovering && !this.discovery.running) return;
    this._discovering = false;
    this.discovery.stop();
    this._publish();
  }

  private _disconnect(): void {
    this._stopDiscovery();
    this.link.stop();
    this._stopLoop();
    this._wasConnected = false;
  }

  private _onConnected(): void {
    this._wasConnected = true;
    // firmware sends handshake immediately, then unsolicited CMD 0x11 on connect
    this.link.send(Cmd.HANDSHAKE, DeviceFrames.handshake());
    this.link.send(Cmd.KEYBOARD_REPORT_MODE, DeviceFrames.reportMode(this._mode.wireByte));
    this._logger.success("handshake sent");
  }

  private _pressPhysicalKey(buttonId: number): void {
    if (this._mode.isVirtual) {
      this._logger.warn("physical key ignored — keyboard is in virtual mode");
      return;
    }
    if (!ButtonIds.isValid(buttonId)) return;
    this.dispenser.pressKey(buttonId as ButtonId);
  }

  private _route(frame: RxFrame): void {
    switch (frame.cmd) {
      case Cmd.TIME_SYNC:
        this._system.handleTimeSync(frame);
        break;
      case Cmd.KEEP_ALIVE:
        this._system.handlePing();
        break;
      case Cmd.SET_RELAY:
        this._system.handleSetRelay(frame);
        break;
      case Cmd.KEYBOARD_SET_MODE:
        this._system.handleSetMode(frame);
        break;
      case Cmd.KEYBOARD_PRESS_VIRTUAL_BUTTONS:
        this._pressButtons.handle(frame);
        break;
      case Cmd.KEYBOARD_REQUEST_USER_OPERATION:
        this._requestOp.handle(frame);
        break;
      case Cmd.KEYBOARD_STOP_PUMPING:
        this._stopPump.handle(frame);
        break;
      case Cmd.OTA_START:
      case Cmd.OTA_SEND_FILE:
      case Cmd.OTA_ACTIVATE:
        this._logger.warn(`OTA cmd 0x${frame.cmd.toString(16)} ignored (out of scope)`);
        break;
      default:
        this._logger.log(`unhandled cmd 0x${frame.cmd.toString(16)}`);
        break;
    }
    this._publish();
  }

  private _startLoop(): void {
    if (this._loop) return;
    this._loop = setInterval(() => {
      const now = this.clock.now();
      this.job.advance(now);
      this.dispenser.tick(now);
    }, LOOP_INTERVAL_MS);
  }

  private _stopLoop(): void {
    if (this._loop) {
      clearInterval(this._loop);
      this._loop = null;
    }
  }

  private _publish(): void {
    this.changes.notify(this.snapshot());
  }
}

export const seenDeviceSimulator = new SeenDeviceSimulator();
