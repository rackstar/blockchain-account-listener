## Instructions

**Start**

```bash
npm i && npm start
```

**Test**

```bash
npm test
```

## Supported Node.js Versions

The code coverage package used in this project utilizes native V8 coverage, please ensure to use Node.js >= 12 when running tests.

## Requirements

- [x] Display a short message log message to console when each (accountId + version) tuple has been
      indexed.
- [x] Display a callback log when an account’s `call_back_time_ms` has expired.
- [x] If the same account is ingested with a newer version number, and the old callback has not fired yet, cancel the older
      version’s active callback.
- [x] If an old version of the same account is ingested, ignore that update.
- [x] Display a message when an old callback is canceled in favor of a new one.
- [x] Once all events and callbacks have completed:
  - [x] print the highest token-value accounts by
      `AccountType` (taking into account write version)
  - [x] gracefully shut-down the system.

## Design Solutions

There are multiple ways to solve the cancellation/prevention of an already running process which is deferred to be executed at a later time (i.e setTimeout):

1. clearTimeout

```typescript
// execute setTimeout & take note of id, version and timeoutId
const timeoutId = setTimeout(...);
// ...further execution
// if the new incoming event's version is > the current version (for the given id), cancel the timeout
clearTimeout(timeoutId);
```

2. Lazy Load

This does not employ cancelling the `setTimeout`, rather it prevents the execution of the callback if it turns out that during the lifetime of the `setTimeout` a new version (from another process) has superseded the current execution's version.

The callback will only execute if the version (for a given id) has NOT been superseded during the lifetime of the `setTimeout` for that particular execution.

Option 2 has been implemented as its simpler of the two, as we only need:

1. Take note of the current version to be executed (for the given id)
2. A conditional operation once the `callbackTimeMs` has expired

```typescript
// Set the id's version to the latest available (i.e. ignore if older version)
let currentVersion = Math.max(incomingVersion, currentVersion);
setTimeout(() => {
  // if this process's version is still the same as the saved currentVersion
     // EXECUTE callback - the version has NOT been superseded
  // else
     // SKIP callback - the version has been superseded by a newer version from another process
}, callbackTimeMs);
```

## Logging

In my opinion production quality code should have enough logs (error, warn, info, debug, etc..)

The logging should default to `info` but with the option of enabling other log levels (i.e. debug) so it can provide better visibility, if need be when investigating issues.

To enable debug logging set an env var `LOG_LEVEL=debug` or `npm start-debug`
```bash
LOG_LEVEL=debug npm start
```

Supported levels 'trace', 'debug', 'info', 'warn', 'error', 'fatal'.

## Monitoring

**Index Lag**

When implementing indexers, it is important to monitor the lag between the current block height that was indexed and latest block height available in the blockchain. There should be an alert if the lag widens beyond an acceptable amount, especially if the lag steadily grows over time.

Indexers needs to be efficient and robust, it should handle issues gracefully with the goal of always staying close to the head of chain.

**Failed Events**

In production, if an event fails to be processed it is a good idea to retry the event. If the event still fails after N retries, the event should then be pushed to a dead-letter queue (DLQ) to be investigated later.

Additionally, we should monitor (and be alerted) for any rapid DLQ growth, and ideally, every event that is pushed to the DLQ should also trigger a ticket / notification for the backend.

**Re-orgs**

While short and shallow re-orgs are routine, we should monitor for deeper and extended re-orgs as this could have significant implications for the users' account state. Monitoring this ensures that the system is always aligned and consistent with the correct head of the chain.

**Latency**

There should be an acceptable latency metric for third-party services (node providers, blockchain RPC calls, etc..) especially if the system is highly dependent on these. There should be alternative backup services that are available to the system to avoid a single point of failure.

## Code Style

The code style follows prettier and airbnb style guide. This project uses Eslint with prettier, airbnb and typescript plugins.
