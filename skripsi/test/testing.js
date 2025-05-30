const { expect } = require("chai");

describe("SimpleStorage", function () {
  let SimpleStorage, simpleStorage, owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorage.deploy();
  });

  it("Should return the initial value as 0", async function () {
    expect(await simpleStorage.getValue()).to.equal(0);
  });

  it("Should update the value correctly", async function () {
    await simpleStorage.setValue(42);
    expect(await simpleStorage.getValue()).to.equal(42);
  });

  it("Should emit ValueChanged event", async function () {
    await expect(simpleStorage.setValue(100))
      .to.emit(simpleStorage, "ValueChanged")
      .withArgs(100);
  });
});
