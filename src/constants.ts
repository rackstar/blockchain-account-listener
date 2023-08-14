/**
 * `ACCOUNT_TYPES_CONST` is used to link the `ACCOUNT_TYPES` array values (below) and the type `AccountType` (types.ts)
 * any changes on `ACCOUNT_TYPES_CONST` will automatically be reflected on both `ACCOUNT_TYPES` and `AccountType`
 */
export const ACCOUNT_TYPES_CONST = [
  "mint",
  "metadata",
  "masterEdition",
  "auction",
  "auctionData",
  "account",
  "escrow",
] as const;

/**
 * Used for accountType validation
 */
export const ACCOUNT_TYPES = ACCOUNT_TYPES_CONST.slice();
