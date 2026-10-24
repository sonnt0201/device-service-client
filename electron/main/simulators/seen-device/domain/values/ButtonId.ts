/**
 * SEEN keyboard button IDs.
 *
 * Mirror of `../LogiProj_DeviceV2/App/Control/Keyboard/ButtonAlias.h`
 * (`#if DEV_TYPE == SEEN_DEV`). The numeric values are the wire IDs carried by
 * `CMD 0x14` / `CMD 0x17` and must never be renumbered.
 */
export enum ButtonId {
  F2 = 0,
  L = 1,
  F3 = 2,
  P = 3,
  TOTAL = 4,
  F4 = 5,
  DOLLAR = 6,
  F1 = 7,
  N9 = 8,
  N0 = 9,
  E = 10,
  N00 = 11,
  N000 = 12,
  C = 13,
  TIME = 14,
  F5 = 15,
  N7 = 16,
  N8 = 17,
  N4 = 18,
  N3 = 19,
  N1 = 20,
  N2 = 21,
  N6 = 22,
  N5 = 23,
  S = 24,
}

/** Wire value for "no button pressed / release" (`RELEASE_BUTTON` in firmware). */
export const RELEASE_BUTTON = 0xff;

export const SEEN_BUTTON_COUNT = 25;

const DIGIT_TO_BUTTON: Record<string, ButtonId> = {
  "0": ButtonId.N0,
  "1": ButtonId.N1,
  "2": ButtonId.N2,
  "3": ButtonId.N3,
  "4": ButtonId.N4,
  "5": ButtonId.N5,
  "6": ButtonId.N6,
  "7": ButtonId.N7,
  "8": ButtonId.N8,
  "9": ButtonId.N9,
};

const BUTTON_TO_DIGIT: Partial<Record<ButtonId, string>> = Object.fromEntries(
  Object.entries(DIGIT_TO_BUTTON).map(([digit, id]) => [id, digit]),
) as Partial<Record<ButtonId, string>>;

/** Label shown on the physical key (also used by the renderer keyboard). */
const BUTTON_LABEL: Record<ButtonId, string> = {
  [ButtonId.F1]: "F1",
  [ButtonId.F2]: "F2",
  [ButtonId.F3]: "F3",
  [ButtonId.F4]: "F4",
  [ButtonId.F5]: "F5",
  [ButtonId.L]: "L",
  [ButtonId.P]: "P",
  [ButtonId.TOTAL]: "TOTAL",
  [ButtonId.DOLLAR]: "$",
  [ButtonId.E]: "E",
  [ButtonId.C]: "C",
  [ButtonId.S]: "S",
  [ButtonId.TIME]: "TIME",
  [ButtonId.N0]: "0",
  [ButtonId.N00]: "00",
  [ButtonId.N000]: "000",
  [ButtonId.N1]: "1",
  [ButtonId.N2]: "2",
  [ButtonId.N3]: "3",
  [ButtonId.N4]: "4",
  [ButtonId.N5]: "5",
  [ButtonId.N6]: "6",
  [ButtonId.N7]: "7",
  [ButtonId.N8]: "8",
  [ButtonId.N9]: "9",
};

/** Buttons that begin a cost preset (`$` or any `F`), per `MachineStateService_Seen.c`. */
const COST_PRESET_STARTERS = new Set<ButtonId>([
  ButtonId.DOLLAR,
  ButtonId.F1,
  ButtonId.F2,
  ButtonId.F3,
  ButtonId.F4,
  ButtonId.F5,
]);

/** Buttons that begin a litre preset (`L` or any `F`). */
const LIT_PRESET_STARTERS = new Set<ButtonId>([
  ButtonId.L,
  ButtonId.F1,
  ButtonId.F2,
  ButtonId.F3,
  ButtonId.F4,
  ButtonId.F5,
]);

export const ButtonIds = {
  isValid(id: number): id is ButtonId {
    return id >= 0 && id < SEEN_BUTTON_COUNT;
  },

  isDigit(id: ButtonId): boolean {
    return id in BUTTON_TO_DIGIT;
  },

  /** `"0".."9"` for a digit key including the `00` / `000` keys, else `null`. */
  digitString(id: ButtonId): string | null {
    if (id === ButtonId.N00) return "00";
    if (id === ButtonId.N000) return "000";
    return BUTTON_TO_DIGIT[id] ?? null;
  },

  fromDigitChar(char: string): ButtonId {
    return DIGIT_TO_BUTTON[char] ?? (RELEASE_BUTTON as unknown as ButtonId);
  },

  isCostPresetStarter(id: ButtonId): boolean {
    return COST_PRESET_STARTERS.has(id);
  },

  isLitPresetStarter(id: ButtonId): boolean {
    return LIT_PRESET_STARTERS.has(id);
  },

  label(id: number): string {
    return BUTTON_LABEL[id as ButtonId] ?? `#${id}`;
  },
} as const;
