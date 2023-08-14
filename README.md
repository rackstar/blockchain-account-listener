## Instructions

Start

```bash
npm i && npm start
```

Test

```bash
npm test
```

## Requirements

- [x] (Display a short message log message to console when each (accountId + version) tuple has been
      indexed.)
- [x] Display a callback log when an account’s `call_back_time_ms` has expired.
- [x] If the same account is ingested with a newer version number, and the old callback has not fired yet, cancel the older
      version’s active callback.
- [x] If an old version of the same account is ingested, ignore that update.
- [x] Display a message when an old callback is canceled in favor of a new one.
- [x] Once all events and callbacks have completed, print the highest token-value accounts by
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

1. Take note of current version (for the given id)
2. A conditional operation once the `callbackTimeMs` has expired

```typescript
// Set the id's current version whichever is the highest of the incoming or the current version
let currentVersion = Math.max(incomingVersion, currentVersion);
// Only execute the callback if no other process has replaced
setTimeout(() => {
  // if this process's version is the same as the currentVersion
  // EXECUTE callback - the version has NOT been superseded
  // else
  // SKIP callback - the version has been superseded by a newer version from another process
}, callbackTimeMs);
```

## Logging

In my opinion production quality code should have enough logs (error, warn, info, debug)

The logging should default to `info` but with the option of enabling other log level (i.e. `debug`) to enable us to investigate and give us better visibility what is happening in the code in case of any issues.

To enable debug logging set an env var `LOG_LEVEL=debug`

```bash
LOG_LEVEL=debug npm start
```

Supported levels 'trace', 'debug', 'info', 'warn', 'error', 'fatal'

## Monitoring

Index Lag

When implementing indexers, its important to monitor the lag between the current block that is indexed and what is the latest block available in the blockchain. If the lag widens beyond an acceptable amount (specially if the lags steadily grows overtime) we should be alerted to fix the issue so that the indexer can catch up again to the head of the chain.

Re-orgs

While short and shallow re-orgs are routine, we should monitor for deeper and extended re-orgs as this could have a significant implications to users account state. Monitoring this ensures that the system is aligned and consistent with the correct head of the chain

Failed Events

In production, if an event fails to be processed its a good idea to retry the event. If the event still fails after N retries, the event should then be pushed to a dead-letter queue (DLQ) to be investigated later.

Additionally we should monitor and be alerted for any rapid DLQ growth, and ideally every event that is pushed to the DLQ should also trigger an ticket for the backend

Latency

There should be an acceptance latency metric for 3rd party services including blockchain RPC calls specially if the system is highly dependent on these. There should be alternative 3rd party service that is available to the system to avoid a single point of failure

## Code Style

The code style follows prettier and airbnb javascript standard. This projects uses eslint with prettier, airbnb and typescript plugins.
