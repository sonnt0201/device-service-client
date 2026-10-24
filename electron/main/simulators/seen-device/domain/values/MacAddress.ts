/**
 * A 6-byte device MAC address, MSB -> LSB on the wire.
 */
export class MacAddress {
  private constructor(private readonly _bytes: readonly number[]) {}

  /** Accepts `"0008DC780404"` or `"00:08:DC:78:04:04"` (case-insensitive). */
  static parse(text: string): MacAddress {
    const hex = (text ?? "").replace(/[^0-9a-fA-F]/g, "");
    if (hex.length !== 12) {
      throw new RangeError(`MAC must be 12 hex digits: "${text}"`);
    }
    const bytes: number[] = [];
    for (let i = 0; i < 12; i += 2) {
      bytes.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return new MacAddress(bytes);
  }

  static fromBytes(bytes: readonly number[]): MacAddress {
    if (bytes.length !== 6) throw new RangeError("MAC needs exactly 6 bytes");
    return new MacAddress(bytes.map((b) => b & 0xff));
  }

  /** MSB -> LSB, as it travels in the frame header. */
  get bytes(): number[] {
    return [...this._bytes];
  }

  /** `"0008dc780404"` — the form Device Service / the renderer use as `device_id`. */
  toHex(): string {
    return this._bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  equals(other: MacAddress): boolean {
    return this.toHex() === other.toHex();
  }
}
