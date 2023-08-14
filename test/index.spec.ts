import { expect } from "chai";
import { after, afterEach, before, describe, it } from "mocha";
import { SinonFakeTimers, SinonSandbox, SinonSpy, createSandbox } from "sinon";
import { testAccountUpdates } from "./test-data.spec";

describe("Acceptance Criteria Tests", () => {
  let sandbox: SinonSandbox;
  let consoleSpy: SinonSpy;
  let clock: SinonFakeTimers;

  before(() => {
    sandbox = createSandbox();
    consoleSpy = sandbox.spy(console, "info");
    clock = sandbox.useFakeTimers();
  });
  afterEach(() => consoleSpy.resetHistory());
  after(() => sandbox.restore());

  it("should display a short message log message to when each (accountId + version) tuple has been indexed", () => {
    const [accountUpdate] = testAccountUpdates();
    const { id, version, callbackTimeMs } = accountUpdate;
    // indexer.index(accountUpdate);
    expect(
      consoleSpy.calledWithMatch(
        `${id} v${version} indexed +${callbackTimeMs}ms`,
      ),
    ).to.be.true;
  });

  it("should display a callback log when an account's callbackTimeMs has expired", () => {
    const [accountUpdate] = testAccountUpdates();
    const { id, version, callbackTimeMs } = accountUpdate;
    // indexer.index(accountUpdate)
    clock.tick(callbackTimeMs + 10);
    expect(consoleSpy.calledWithMatch(`${id} v${version} cb executed`)).to.be
      .true;
  });
  it("should cancel the old callback if it has not fired yet and a new version from the same account is ingested", () => {
    const [accountUpdate1, accountUpdate2] = testAccountUpdates();
    const { id, version, callbackTimeMs } = accountUpdate1;
    // indexer.index(accountUpdate1)
    clock.tick(accountUpdate1.callbackTimeMs - 200);
    // indexer.index(accountUpdate2)
    clock.tick(210);
    expect(
      consoleSpy.calledWithMatch(
        `${id} v${version} cb cancelled by v${accountUpdate2.version}`,
      ),
    ).to.be.true;
    clock.tick(accountUpdate2.callbackTimeMs - 200);
    expect(
      consoleSpy.calledWithMatch(
        `${accountUpdate2.id} v${accountUpdate2.version} cb executed`,
      ),
    ).to.be.true;
  });
  it("should ignore the account update if the incoming update is of an older version", () => {
    const [accountUpdate] = testAccountUpdates();
    const accountUpdateOld = {
      ...accountUpdate,
      version: accountUpdate.version - 1,
    };
    const { id, version, callbackTimeMs } = accountUpdate;
    // indexer.index(accountUpdate);
    // indexer.index(accountUpdateOld);
    clock.tick(callbackTimeMs + 10);
    expect(consoleSpy.calledWithMatch(`${id} v${version} cb executed`)).to.be
      .true;
    expect(
      consoleSpy.notCalledWithMatch(
        `${accountUpdateOld.id} v${accountUpdateOld.version} cb executed`,
      ),
    ).to.be.true;
  });
});
