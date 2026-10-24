/**
 * User-operation / preset event type.
 *
 * Mirror of `PresetType` in `../LogiProj_DeviceV2/App/Gateway` — carried as the
 * first payload byte of `CMD 0x13` and `CMD 0x16`.
 */
export enum PresetKind {
  NONE = 0,
  ERROR = 1,
  COST = 2,
  LIT = 3,
  SET_PRICE = 4,
}
