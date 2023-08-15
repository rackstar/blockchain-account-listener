import { expect } from "chai";
import { random } from "../src/utils.js";

describe("random", () => {
  it("should return a number between min and max inclusive", () => {
    const min = 1;
    const max = 10;

    for (let i = 0; i < 10; i += 1) {
      const result = random(min, max);
      expect(result).to.be.at.least(min);
      expect(result).to.be.at.most(max);
      expect(Number.isInteger(result)).to.be.true;
    }
  });

  it("should handle the case where min equals max", () => {
    const sameValue = 5;
    const result = random(sameValue, sameValue);
    expect(result).to.equal(sameValue);
  });
});
