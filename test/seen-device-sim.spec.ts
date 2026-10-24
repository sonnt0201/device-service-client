import { describe, expect, test } from "vitest";

import { DeviceWireCodec, RxFrameParser } from "../electron/main/simulators/seen-device/infrastructure/DeviceWireCodec";
import { Cmd } from "../electron/main/simulators/seen-device/infrastructure/protocol";
import { parseDiscoveryBeacon } from "../electron/main/simulators/seen-device/infrastructure/DeviceServiceDiscovery";
import { DeviceFrames } from "../electron/main/simulators/seen-device/infrastructure/DeviceFrames";
import { PresetValue } from "../electron/main/simulators/seen-device/domain/values/PresetValue";
import { PresetKind } from "../electron/main/simulators/seen-device/domain/values/PresetKind";
import { ButtonId } from "../electron/main/simulators/seen-device/domain/values/ButtonId";
import { DeviceClock } from "../electron/main/simulators/seen-device/domain/DeviceClock";
import { SeenDispenser } from "../electron/main/simulators/seen-device/domain/SeenDispenser";
import { VirtualButtonJob } from "../electron/main/simulators/seen-device/domain/VirtualButtonJob";
import { SeenDomainEvent, VirtualJobEvent } from "../electron/main/simulators/seen-device/domain/events";

describe("DeviceWireCodec", () => {
  test("encode then parse round-trips header + payload", () => {
    const mac = [0x00, 0x08, 0xdc, 0x78, 0x04, 0x04];
    const frame = DeviceWireCodec.encode(mac, Cmd.KEYBOARD_REPORT_MODE, [1]);
    // 12 header + 1 payload
    expect(frame.length).toBe(13);
    expect(frame[0]).toBe(0x00);
    expect(frame[1]).toBe(0x01); // len = 1, big-endian

    const [parsed] = new RxFrameParser().push(frame);
    expect(parsed.cmd).toBe(Cmd.KEYBOARD_REPORT_MODE);
    expect(parsed.mac).toEqual(mac);
    expect(parsed.payload).toEqual([1]);
  });

  test("reassembles a frame split across chunks and yields two frames from one chunk", () => {
    const mac = [1, 2, 3, 4, 5, 6];
    const a = DeviceWireCodec.encode(mac, Cmd.TIME_SYNC, [0, 0, 0, 0, 0, 0, 0, 9]);
    const b = DeviceWireCodec.encode(mac, Cmd.KEEP_ALIVE, []);

    const parser = new RxFrameParser();
    expect(parser.push(a.subarray(0, 5))).toHaveLength(0);
    const out = parser.push(Buffer.concat([a.subarray(5), b]));
    expect(out.map((f) => f.cmd)).toEqual([Cmd.TIME_SYNC, Cmd.KEEP_ALIVE]);
  });

  test("handshake payload identifies SEEN (0x0003) big-endian", () => {
    const p = DeviceFrames.handshake();
    expect(p.slice(0, 2)).toEqual([0x00, 0x03]);
    expect(p[2]).toBe(2); // total relay
  });
});

describe("parseDiscoveryBeacon", () => {
  test("reads the Device Service TCP port (big-endian) from the beacon", () => {
    // 'A','A','A','A', 0x13,0x88 (=5000), 'A','A'
    const beacon = Buffer.from([0x41, 0x41, 0x41, 0x41, 0x13, 0x88, 0x41, 0x41]);
    expect(parseDiscoveryBeacon(beacon)).toBe(5000);
  });

  test("finds the marker at a non-zero offset", () => {
    const beacon = Buffer.from([0xff, 0x00, 0x41, 0x41, 0x41, 0x41, 0x13, 0x88, 0x41, 0x41]);
    expect(parseDiscoveryBeacon(beacon)).toBe(5000);
  });

  test("rejects noise with no marker", () => {
    expect(parseDiscoveryBeacon(Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]))).toBeNull();
    expect(parseDiscoveryBeacon(Buffer.alloc(4))).toBeNull();
  });
});

describe("PresetValue", () => {
  test("cost strips thousands separators to integer VND", () => {
    expect(PresetValue.parse(PresetKind.COST, "56.214").text).toBe("56214");
    expect(PresetValue.fromNumber(PresetKind.COST, 60000).text).toBe("60000");
  });

  test("litre is padded to exactly 3 decimals", () => {
    expect(PresetValue.parse(PresetKind.LIT, "3.1").text).toBe("3.100");
    expect(PresetValue.fromNumber(PresetKind.LIT, 3.123).text).toBe("3.123");
  });

  test("cost expands to [C][$] digits [release]", () => {
    const seq = PresetValue.parse(PresetKind.COST, "60000").toButtonSequence();
    expect(seq.slice(0, 2)).toEqual([ButtonId.C, ButtonId.DOLLAR]);
    expect(seq.slice(2, 7)).toEqual([
      ButtonId.N6,
      ButtonId.N0,
      ButtonId.N0,
      ButtonId.N0,
      ButtonId.N0,
    ]);
    expect(seq[seq.length - 1]).toBe(0xff);
  });

  test("rejects a 9-digit cost", () => {
    expect(() => PresetValue.parse(PresetKind.COST, "123456789")).toThrow();
  });
});

describe("SeenDispenser", () => {
  function setup() {
    const clock = new DeviceClock();
    const d = new SeenDispenser(clock);
    const events: SeenDomainEvent[] = [];
    d.events.subcribe({ update: (e) => events.push(e) });
    return { d, events };
  }

  test("keypad cost preset then nozzle lift arms the preset and starts the pump", () => {
    const { d, events } = setup();

    d.pressKey(ButtonId.DOLLAR);
    for (const k of [ButtonId.N6, ButtonId.N0, ButtonId.N0, ButtonId.N0, ButtonId.N0]) d.pressKey(k);
    expect(d.state).toBe("PRESETTING_COST");
    expect(d.keyboardScreen().retrieveNumber()).toBe("60000");
    expect(d.screenShowsNumber("60000")).toBe(true);

    d.liftNozzle();
    const preset = events.find((e) => e.type === "preset-entered");
    expect(preset).toMatchObject({ kind: PresetKind.COST, value: "60000" });
    expect(d.state).toBe("PUMPING");
    expect(events.some((e) => e.type === "pump-started")).toBe(true);
  });

  test("pump ramps to the cost target then books the sale on seat", () => {
    const { d, events } = setup();
    d.configureUnitPrice(20000);
    d.configureFlow(5); // fast for the test

    d.pressKey(ButtonId.DOLLAR);
    for (const k of [ButtonId.N2, ButtonId.N0, ButtonId.N0, ButtonId.N0, ButtonId.N0]) d.pressKey(k); // 20000 VND
    d.liftNozzle();

    let now = 0;
    for (let i = 0; i < 40; i++) {
      now += 100;
      d.tick(now);
    }

    const last = [...events].reverse().find((e) => e.type === "pump-progressed") as
      | Extract<SeenDomainEvent, { type: "pump-progressed" }>
      | undefined;
    expect(last).toBeDefined();
    expect(last!.cost).toBeLessThanOrEqual(20000);
    // 20000 VND / 20000 per litre = 1.000 L target
    expect(last!.volume).toBeCloseTo(1.0, 2);

    d.seatNozzle();
    const sale = events.find((e) => e.type === "sale-completed") as
      | Extract<SeenDomainEvent, { type: "sale-completed" }>
      | undefined;
    expect(sale).toBeDefined();
    expect(sale!.volume).toBeCloseTo(1.0, 2);
    expect(d.state).toBe("IDLE");
  });

  test("C clears a preset in progress but is ignored while pumping", () => {
    const { d } = setup();
    d.pressKey(ButtonId.L);
    d.pressKey(ButtonId.N5);
    expect(d.state).toBe("PRESETTING_LIT");
    d.pressKey(ButtonId.C);
    expect(d.state).toBe("IDLE");

    d.pressKey(ButtonId.L);
    d.pressKey(ButtonId.N5);
    d.liftNozzle();
    expect(d.state).toBe("PUMPING");
    d.pressKey(ButtonId.C);
    expect(d.state).toBe("PUMPING");
  });
});

describe("VirtualButtonJob", () => {
  test("emits one button per interval then completes; rejects a concurrent job", () => {
    const job = new VirtualButtonJob();
    const seen: VirtualJobEvent[] = [];
    job.events.subcribe({ update: (e) => seen.push(e) });

    expect(job.enqueue([ButtonId.C, ButtonId.DOLLAR], 0)).toBe(0);
    expect(job.enqueue([ButtonId.N1], 0)).toBe(1 /* BUSY */);

    // [C, release, $, release] @ 500ms steps
    let now = 0;
    for (let i = 0; i < 6; i++) {
      now += 500;
      job.advance(now);
    }

    const emitted = seen.filter((e) => e.type === "button-emitted").map((e) => (e as any).id);
    expect(emitted).toEqual([ButtonId.C, 0xff, ButtonId.DOLLAR, 0xff]);
    expect(seen.some((e) => e.type === "completed")).toBe(true);
    expect(job.isRunning).toBe(false);
  });

  test("failed validation surfaces an execution error", () => {
    const job = new VirtualButtonJob();
    const seen: VirtualJobEvent[] = [];
    job.events.subcribe({ update: (e) => seen.push(e) });

    job.enqueue([ButtonId.N1], 0, { validate: () => false });
    let now = 0;
    for (let i = 0; i < 4; i++) {
      now += 500;
      job.advance(now);
    }
    expect(seen.some((e) => e.type === "failed")).toBe(true);
  });
});
