import { ACCOUNT_TYPES_CONST } from "./constants.js";

export type AccountType = (typeof ACCOUNT_TYPES_CONST)[number];

export type EventName = "ACCOUNT_UPDATE";

export interface EventObject {
  name: EventName;
  event: { [key: string]: any };
}

/**
 * NOTE:
 * For this use case creating a 'general' SolanaAccount type is good enough.
 * However for production, it might be a good idea to create a separate type for each SolanaAccount accountType
 * to enforce the expected fixed data schema for each accountType
 */
export interface SolanaAccount {
  id: string;
  accountType: AccountType;
  tokens: number;
  callbackTimeMs: number;
  data: { [key: string]: string | number | boolean };
  version: number;
}

export type EventListener = (account: EventObject["event"]) => void;

export interface EventEmitterOptions {
  // Enables automatic capturing of promise rejection.
  captureRejections?: boolean | undefined;
}
