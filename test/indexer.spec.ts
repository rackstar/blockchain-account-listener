import { expect } from "chai";
import logLevel from "console-log-level";
import { beforeEach, describe, it } from "mocha";
import * as sinon from "sinon";
import Indexer from "../src/indexer.js";
import { SolanaAccount } from "../src/types.js";
import testAccountUpdates from "./test-data.spec.js";

describe("Indexer", () => {
  let indexer: Indexer;

  beforeEach(() => {
    indexer = new Indexer(logLevel());
  });

  describe("invalid event", () => {
    let accountUpdate: SolanaAccount;
    let infoSpy: sinon.SinonStub;
    let errorSpy: sinon.SinonStub;

    before(() => {
      [accountUpdate] = testAccountUpdates();
      infoSpy = sinon.stub(console, "info");
      errorSpy = sinon.stub(console, "error");
    });
    after(() => sinon.restore());

    it("should return true for valid account updates", () => {
      const { id, version, callbackTimeMs } = accountUpdate;
      const isValid = indexer.listener(accountUpdate);
      expect(isValid).to.be.true;
      expect(
        infoSpy.calledWithMatch(
          `${id} v${version} indexed +${callbackTimeMs}ms`,
        ),
      ).to.be.true;
    });

    it("should return false for invalid account update events", () => {
      const invalidEvent = { ...accountUpdate, version: undefined }; // making version undefined
      const isValid = indexer.listener(invalidEvent);
      expect(isValid).to.be.false;
      expect(errorSpy.calledWithMatch("Unable to process unexpected event")).to
        .be.true;
    });

    it("should push invalid account update events to deadLetterQueue", () => {
      const invalidEvent = { ...accountUpdate, version: undefined }; // making version undefined
      indexer.listener(invalidEvent);
      expect(indexer.getFailedEvents()).to.deep.include(invalidEvent);
    });
  });
});
