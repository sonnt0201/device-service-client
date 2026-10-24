/**
 * The decoded text shown on the SEEN keyboard 7-segment display.
 *
 * Immutable value object. Ports the `ScreenText_*` helpers used by
 * `../LogiProj_DeviceV2/App/Control/Keyboard/MachineStateService_Seen.c` and
 * `UserOperationService_Seen.c` so the same rules drive both the simulated
 * display and preset validation.
 *
 * `KBSCREEN_DECCODED_TEXT_LENGTH` is 16 for SEEN (two 8-cell lines rendered as a
 * flat string).
 */
export const KEYBOARD_TEXT_LENGTH = 16;

export class ScreenText {
  private readonly _content: string;

  private constructor(content: string) {
    // Firmware keeps a fixed 16-char buffer; we keep the trimmed logical text
    // and pad on serialization.
    this._content = content.slice(0, KEYBOARD_TEXT_LENGTH);
  }

  static of(content: string): ScreenText {
    return new ScreenText(content ?? "");
  }

  static blank(): ScreenText {
    return new ScreenText("");
  }

  get content(): string {
    return this._content;
  }

  /** Right-padded to the fixed cell count, for `CMD 0x12` serialization. */
  toFixedWidth(): string {
    return this._content.padEnd(KEYBOARD_TEXT_LENGTH, " ").slice(0, KEYBOARD_TEXT_LENGTH);
  }

  equals(other: ScreenText): boolean {
    return this._content === other._content;
  }

  hasPrefix(prefix: string): boolean {
    return this._content.startsWith(prefix);
  }

  /**
   * Extract the numeric part: digits, plus a `.` only when it sits between two
   * digits. Mirrors `_utils_RetrieveNumberFrom`.
   */
  retrieveNumber(): string {
    let out = "";
    for (let i = 0; i < this._content.length; i++) {
      const ch = this._content[i];
      if (ch >= "0" && ch <= "9") {
        out += ch;
      } else if (ch === "." && i > 0 && this._content[i - 1] >= "0" && this._content[i - 1] <= "9") {
        out += ".";
      }
    }
    return out;
  }

  /** `ScreenText_IsNumberOnly`: only digits and `.` (ignoring surrounding spaces). */
  isNumberOnly(): boolean {
    const trimmed = this._content.trim();
    if (trimmed.length === 0) return false;
    return /^[0-9.]+$/.test(trimmed);
  }

  /** `ScreenText_ClearChars` for a single char. */
  clearChars(char: string): ScreenText {
    return new ScreenText(this._content.split(char).join(""));
  }
}
