import * as consoleLog from "console-log-level";
import { ACCOUNT_TYPES } from "./constants";
import { AccountType, EventObject, SolanaAccount } from "./types";
import { inspect } from "./utils";

type Id = string;
type Version = number;

interface IIndexer {
  listener: (event: EventObject["event"]) => void;
  printHighestTokenAccounts: () => void;
  getFailedEvents: () => Record<string, any>[];
}

export default class Indexer implements IIndexer {
  private readonly log: consoleLog.Logger;

  private idVersionToBeExecuted: Record<Id, Version>;

  private highestTokenAccounts: { [key in AccountType]?: SolanaAccount };

  private deadLetterQueue: Record<string, any>[];

  constructor(logger: consoleLog.Logger) {
    this.log = logger;
    this.idVersionToBeExecuted = {};
    this.highestTokenAccounts = {};
    this.deadLetterQueue = [];
  }

  /**
   * Listener function that will receive the event
   * Calls the index function, passing in the event and callback
   * @param eventData
   */
  public listener = (event: EventObject["event"]): boolean => {
    this.log.debug(`listener(event: ${inspect(event)})`);
    const start = Date.now();
    const callback = (accountUpdate: SolanaAccount) => {
      const { id, version } = accountUpdate;
      this.log.info(`${id} v${version} cb executed +${Date.now() - start}ms`);
    };
    return this.index(event, callback);
  };

  /**
   * Prints the highest token account details for each of the accountTypes in descending order
   */
  public printHighestTokenAccounts(): void {
    console.info("\nHighest Tokens Leaderboard\n");
    Object.values(this.highestTokenAccounts)
      .sort((a, b) => b.tokens - a.tokens)
      .forEach((account) => {
        const { id, version, tokens } = account;
        console.info(account.accountType.toUpperCase());
        if (id && version) {
          console.info(`${id} v${version}: ${tokens || 0}`);
        }
      });
  }

  /**
   * Retrieves the current list of failedEvents
   */
  public getFailedEvents = (): Record<string, any>[] => this.deadLetterQueue;

  /**
   * Indexes the event and updates the highestTokenAccounts if needed
   * @param event
   * @returns boolean - true, successfully processed the event. false, failed to process the event.
   */
  private readonly index = (
    event: EventObject["event"],
    callback: (accountUpdate: SolanaAccount) => void,
  ): boolean => {
    this.log.debug(`index(event: ${inspect(event)})`);

    // validate the incoming event as there is no guarantee that the event will always be an account update
    if (this.isAccountUpdate(event)) {
      this.executeCallbackDelay(event, callback);
      this.setHighestTokenAccount(event);
      return true;
    }
    // NOTE:
    // In production systems, if an event fails to be processed its a good idea to retry the event. If it still fails
    // after N retries, the event should then be pushed to a dead-letter queue (DLQ) to be investigated later.
    // Additionally, for each failed event a corresponding alert should be created to notify the backend of the failure
    this.log.error(`Unable to process unexpected event:\n${inspect(event)}`);
    this.deadLetterQueue.push(event);
    return false;
  };

  /**
   * Employs lazy loading
   * The callback will only execute if the version is not superseded by a newer version from another process
   * Ignores events with older version than the current one for a given id
   * @param accountUpdate
   */
  private readonly executeCallbackDelay = (
    accountUpdate: SolanaAccount,
    callback: (accountUpdate: SolanaAccount) => void,
  ): void => {
    this.log.debug(
      "executeCallbackDelay",
      `accountUpdate: ${inspect(accountUpdate)}`,
      `callback: ${callback})`,
    );
    const { id, version, callbackTimeMs } = accountUpdate;

    // update the id version mapping if the incoming version is higher than the current version to be executed
    const currVersionToBeExecuted = this.idVersionToBeExecuted[id] || 0;
    if (version < currVersionToBeExecuted) {
      this.log.info(
        `${id} v${version} ignored, current v${currVersionToBeExecuted}`,
      );
      return;
    }
    this.log.info(`${id} v${version} indexed +${callbackTimeMs}ms`);
    this.idVersionToBeExecuted[id] = Math.max(version, currVersionToBeExecuted);

    setTimeout(() => {
      // lazy load - once the callbackTimeMs expires, check if the current execution's version has been replaced or not
      const versionToBeExecuted = this.idVersionToBeExecuted[id];
      if (version !== versionToBeExecuted) {
        // cancelled - has been replaced with a newer version
        this.log.info(
          `${id} v${version} cb cancelled by v${versionToBeExecuted}`,
        );
      } else {
        // not cancelled - execute callback
        callback(accountUpdate);
      }
    }, callbackTimeMs);
  };

  /**
   * Sets the current highest token account on highestTokenAccounts mapping
   * @param accountUpdate
   */
  private readonly setHighestTokenAccount = (
    accountUpdate: SolanaAccount,
  ): void => {
    const { accountType, id, version, tokens } = accountUpdate;
    const currentHighest = this.highestTokenAccounts[accountType];
    const highestToken = currentHighest?.tokens || 0;
    if (tokens > highestToken) {
      this.log.debug(
        `${accountType} new highest token account\n${id} v${version} ${tokens} tokens`,
      );
      if (currentHighest) {
        this.log.debug(
          `${accountType} previous highest token account\n${currentHighest.id} v${currentHighest.version} ${highestToken} tokens`,
        );
      }
      this.highestTokenAccounts[accountType] = accountUpdate;
    }
  };

  /**
   * Type guard to validate the incoming event is indeed an account update event
   */
  private readonly isAccountUpdate = (
    event: EventObject["event"],
  ): event is SolanaAccount => {
    const { id, accountType, tokens, callbackTimeMs, version } = event;
    if (typeof id !== "string") {
      this.log.error(`id is not a string: ${id}`);
      return false;
    }
    if (!ACCOUNT_TYPES.includes(accountType)) {
      this.log.error(`invalid accountType: ${event.accountType}`);
      this.log.info(`valid accountTypes: ${ACCOUNT_TYPES.join(", ")}`);
      return false;
    }
    if (typeof version !== "number") {
      this.log.error(`invalid version: ${version}`);
      return false;
    }
    if (typeof tokens !== "number" || tokens < 0) {
      this.log.error(`invalid tokens: ${tokens}`);
      return false;
    }
    if (typeof callbackTimeMs !== "number" || callbackTimeMs < 0) {
      this.log.error(`invalid callbackTimeMs ${callbackTimeMs}`);
      return false;
    }
    // NOTE: data is not validated as it can contain anything
    return true;
  };
}
