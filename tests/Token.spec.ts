import { ethers } from "hardhat";
import { ethers as tsEthers } from "ethers";
import { expect } from "chai";

let token: tsEthers.Contract;
let deployer: tsEthers.Signer;
let user: tsEthers.Signer;

describe("ERC20 Token", () => {
  before(async () => {
    deployer = (await ethers.getSigners())[0];

    const REMIContract = await ethers.getContractFactory("REMI");

    token = await REMIContract.deploy();

    await token.deployed();

    user = (await ethers.getSigners())[1];
    // Send ETH to user from signer.
    await deployer.sendTransaction({
      to: await user.getAddress(),
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

  it("Should return the correct total supply", async () => {
    expect(ethers.BigNumber.from(await token.totalSupply())).to.equal(
      ethers.BigNumber.from("10000000000000000000000000000")
    );
  });

  it("Should return the correct total supply at the deployers address", async () => {
    expect(
      ethers.BigNumber.from(await token.balanceOf(await deployer.getAddress()))
    ).to.equal(ethers.BigNumber.from("10000000000000000000000000000"));
  });
});
