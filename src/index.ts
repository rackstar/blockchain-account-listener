/* eslint-disable no-await-in-loop, no-restricted-syntax, no-console */
import * as fs from "fs/promises";
import * as path from "path";
import chalk from "chalk";
import logLevel from "console-log-level";
import Event from "./event.js";
import Indexer from "./indexer.js";
import { SolanaAccount } from "./types.js";
import { delay, inspect, random } from "./utils.js";

/**
 * Reads the data from "./coding-challenge-input.json" and parses it back to JSON
 */
const readBlockData = async (): Promise<any[]> => {
  // use `path.join `to ensure compatibility with other OS (i.e. Windows)
  const jsonPath = path.join("data", "coding-challenge-input.json");
  const jsonString = await fs.readFile(jsonPath, "utf8");
  const blockData = JSON.parse(jsonString);

  if (!Array.isArray(blockData)) {
    const errorMessage = `Corrupted data. Please check the data in ${jsonPath}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return blockData;
};

const execute = async (): Promise<void> => {
  // Log Level - defaults to `info`
  const level = (
    process.env.LOG_LEVEL ?? "info"
  ).toLowerCase() as logLevel.LogLevelNames;
  const log = logLevel({ prefix: () => new Date().toISOString(), level });

  // Load block data
  const blockData = await readBlockData();

  // Create new instances
  const eventEmitter = new Event(log);
  const indexer = new Indexer(log);

  // Listen to ACCOUNT_UPDATE events
  eventEmitter.onEvent("ACCOUNT_UPDATE", indexer.listener);

  let accountUpdate: SolanaAccount = blockData[0]; // initialize to avoid TS error
  for (accountUpdate of blockData) {
    // Emit ACCOUNT_UPDATE events with randomised delay between 0 to 1000ms
    await delay(random(0, 1000));
    await eventEmitter.emitEvent({
      name: "ACCOUNT_UPDATE",
      event: accountUpdate,
    });
  }

  // node process will exit gracefully once there are no more work to be processed in the event loop
  process.on("exit", () => {
    const failedEvents = indexer.getFailedEvents();
    if (failedEvents.length) {
      console.info(
        chalk.red(`\n${failedEvents.length} Failed Events:\n`),
        inspect(failedEvents),
      );
    }
    indexer.printHighestTokenAccounts();
  });
};

// EXECUTE
execute().catch((error) => console.error("Error occurred!", error));
