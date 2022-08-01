import { ethers } from "hardhat";
import { ethers as tsEthers } from "ethers";
import { expect } from "chai";
import { getEventData } from "./utils";

let token: tsEthers.Contract;
let deployer: tsEthers.Signer;
let user: tsEthers.Wallet;

describe("ERC20 Token", () => {
  before(async () => {
    deployer = (await ethers.getSigners())[0];

    const REMIContract = await ethers.getContractFactory("REMI");

    token = await REMIContract.deploy();

    await token.deployed();

    user = new ethers.Wallet(
      "0xbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef",
      deployer.provider
    );
    // Send ETH to user from signer.
    await deployer.sendTransaction({
      to: user.address,
      value: ethers.utils.parseEther("1000")
    });
  });

  it("Should return the correct decimal count", async () => {
    expect(await token.decimals()).to.equal(18);
  });

  it("Should return the correct name", async () => {
    expect(await token.name()).to.equal("Renewable Energy Market Incentive");
  });

  it("Should return the correct symbol", async () => {
    expect(await token.symbol()).to.equal("REMI");
  });

  it("Should return the correct supply", async () => {
    expect(ethers.BigNumber.from(await token.totalSupply())).to.equal(
      ethers.BigNumber.from("10000000000000000000000000000")
    );
  });
});
