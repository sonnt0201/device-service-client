import { ButtonId, ButtonIds, RELEASE_BUTTON } from "./ButtonId";
import { PresetKind } from "./PresetKind";

/**
 * A validated preset amount together with its kind.
 *
 * Holds the normalisation rules that live in
 * `../LogiProj_DeviceV2/App/Control/Keyboard/UserOperationService_Seen.c`
 * (`_toDecimalFormat`) and `KeyboardController.c` (`_normalizePresetNumber`):
 *
 * - `COST` / `SET_PRICE`: integer VND, `.` is a thousands separator and is
 *   stripped. Max 8 digits.
 * - `LIT`: `.` is a decimal point, kept and padded to exactly 3 fraction digits.
 *
 * `Device Service` reads the resulting string verbatim (no further scaling), so
 * getting this wrong is a x1000 money bug.
 */
export class PresetValue {
  private constructor(
    readonly kind: PresetKind,
    /** Canonical wire string, e.g. `"60000"` or `"3.123"`. */
    readonly text: string,
  ) {}

  /**
   * Build from a raw numeric string (what the DS sends in `CMD 0x16`, or what a
   * physical keypad entry produced).
   *
   * @throws {RangeError} when the value is empty or out of range.
   */
  static parse(kind: PresetKind, raw: string): PresetValue {
    const cleaned = (raw ?? "").trim();
    if (!/^[0-9.]*$/.test(cleaned) || cleaned.replace(/\D/g, "").length === 0) {
      throw new RangeError(`preset value is not numeric: "${raw}"`);
    }

    if (kind === PresetKind.LIT) {
      return new PresetValue(kind, PresetValue._toThreeDecimals(cleaned));
    }

    // COST / SET_PRICE -> integer VND
    const digits = cleaned.replace(/\./g, "").replace(/^0+(?=\d)/, "");
    if (digits.length === 0 || digits.length > 8) {
      throw new RangeError(`cost/price must be 1..8 digits: "${raw}"`);
    }
    return new PresetValue(kind, digits);
  }

  /**
   * Build from a numeric value coming from the Logi request
   * (`pre_cost` / `pre_volume` / `pre_price`). Matches DS `_formatCostValue` /
   * `_formatVolumeValue`.
   */
  static fromNumber(kind: PresetKind, value: number): PresetValue {
    const safe = Number.isFinite(value) && value > 0 ? value : 0;
    if (kind === PresetKind.LIT) {
      return PresetValue.parse(kind, safe.toFixed(3));
    }
    return PresetValue.parse(kind, String(Math.round(safe)));
  }

  /** Numeric view, for driving the simulated pump. */
  get amount(): number {
    return Number(this.text);
  }

  /**
   * Expand to the virtual button sequence the firmware would press, from
   * `UserOperationService_Virtual_PresetCost` / `_PresetLiter`:
   * `[C] [$|L] digits… [release]`. `E` is deliberately not pressed.
   */
  toButtonSequence(): ButtonId[] {
    const starter = this.kind === PresetKind.LIT ? ButtonId.L : ButtonId.DOLLAR;
    const seq: ButtonId[] = [ButtonId.C, starter];
    for (const ch of this.text) {
      if (ch === ".") continue;
      seq.push(ButtonIds.fromDigitChar(ch));
    }
    seq.push(RELEASE_BUTTON as unknown as ButtonId);
    return seq;
  }

  private static _toThreeDecimals(input: string): string {
    const [intPartRaw, fracPartRaw = ""] = input.split(".");
    const intPart = intPartRaw.replace(/^0+(?=\d)/, "") || "0";
    if (intPart.length > 4) {
      throw new RangeError(`litre value integer part too large: "${input}"`);
    }
    const frac = (fracPartRaw + "000").slice(0, 3);
    return `${intPart}.${frac}`;
  }
}
