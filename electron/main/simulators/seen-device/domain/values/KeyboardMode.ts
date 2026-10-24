/**
 * Keyboard mux mode.
 *
 * `physical` / `virtual` is the name of the CPLD mux (real keys vs. driven keys),
 * matching firmware `KBMODE_PHYSICAL` / `KBMODE_VIRTUAL` and the wire byte of
 * `CMD 0x10` / `CMD 0x11` (0 / 1). `manu` / `auto` is the LogiAPI *sales-mode*
 * name for the same bit — kept as a mapping helper only.
 */
export type KeyboardModeName = "physical" | "virtual";

export class KeyboardMode {
  static readonly PHYSICAL = new KeyboardMode("physical");
  static readonly VIRTUAL = new KeyboardMode("virtual");

  private constructor(readonly name: KeyboardModeName) {}

  static fromWireByte(byte: number): KeyboardMode {
    return byte === 0 ? KeyboardMode.PHYSICAL : KeyboardMode.VIRTUAL;
  }

  get wireByte(): number {
    return this.name === "physical" ? 0 : 1;
  }

  get isPhysical(): boolean {
    return this.name === "physical";
  }

  get isVirtual(): boolean {
    return this.name === "virtual";
  }

  /** LogiAPI sales-mode label. */
  get salesModeName(): "manu" | "auto" {
    return this.name === "physical" ? "manu" : "auto";
  }

  equals(other: KeyboardMode): boolean {
    return this.name === other.name;
  }
}
