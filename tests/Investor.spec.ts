import hre, { ethers } from "hardhat";
import { ethers as tsEthers } from "ethers";
import { expect } from "chai";
import {
  InvestorVesting,
  InvestorVesting__factory,
  REMI,
  REMI__factory
} from "../build/typechain";

let token: REMI;
let vesting: InvestorVesting;
let deployer: tsEthers.Signer;
let user: tsEthers.Signer;
let user2: tsEthers.Signer;
let user3: tsEthers.Signer;
let user4: tsEthers.Signer;
let operator: tsEthers.Signer;
let startTime = 0;

describe("Investor Vesting", () => {
  before(async () => {
    [deployer, user, user2, user3, operator, user4] = await ethers.getSigners();

    token = await new REMI__factory(deployer).deploy();

    const latestBlockNumber = await ethers.provider.getBlockNumber();
    const latestBlock = await ethers.provider.getBlock(latestBlockNumber);

    startTime = latestBlock.timestamp + 1000;

    vesting = await new InvestorVesting__factory(deployer).deploy(
      token.address,
      startTime
    );

    // transfer tokens into vesting contract
    await token.transfer(vesting.address, ethers.BigNumber.from("100000"));
  });

  it("Should not allow start date before deployment date", async () => {
    await expect(
      new InvestorVesting__factory(deployer).deploy(token.address, 0)
    ).to.revertedWith("Start date cannot be before the deployment date");
  });

  it("Should not allow token address to be zero", async () => {
    const tokenAddress = ethers.constants.AddressZero;
    const latestBlockNumber = await ethers.provider.getBlockNumber();
    const latestBlock = await ethers.provider.getBlock(latestBlockNumber);
    startTime = latestBlock.timestamp + 1000;

    await expect(
      new InvestorVesting__factory(deployer).deploy(tokenAddress, startTime)
    ).to.revertedWith("Address cannot be zero");
  });

  it("Should get token address, balance of token and operator after vesting contract deployed", async () => {
    const tokenAddress = await vesting.token();
    expect(tokenAddress).to.equal(token.address);

    const balance = await token.balanceOf(vesting.address);

    expect(balance).to.equal(ethers.BigNumber.from("100000"));

    const operatorAddress = await vesting.getOperator();
    expect(operatorAddress).to.equal(await deployer.getAddress());
  });

  it("Should only allow owner to set start time", async () => {
    const startDate = startTime + 1000;
    await expect(
      vesting.connect(user).setStartDate(startDate)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(vesting.setStartDate(startDate))
      .to.emit(vesting, "StartDateSet")
      .withArgs(startDate);
  });

  it("Should only allow owner to set operator", async () => {
    const newOperatorAddress = await operator.getAddress();
    await expect(
      vesting.connect(user).setOperator(newOperatorAddress)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await vesting.setOperator(newOperatorAddress);
    expect(await vesting.getOperator()).to.equal(newOperatorAddress);
  });

  it("Should allow operator to set vesting", async () => {
    const userAddress = await user.getAddress();
    const user2Address = await user2.getAddress();
    const userVestingList = [
      {
        beneficiary: userAddress,
        vestingAmount: ethers.BigNumber.from("10000"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("100"),
        initialClaimed: false,
        claimStartTime: startTime + 2592000
      },
      {
        beneficiary: user2Address,
        vestingAmount: ethers.BigNumber.from("20000"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("200"),
        initialClaimed: false,
        claimStartTime: startTime + 2592000
      }
    ];

    //Owner set vesting, should get revert message
    await expect(vesting.setVesting(userVestingList)).to.be.revertedWith(
      "onlyOperator: caller is not the operator"
    );

    await vesting.connect(operator).setVesting(userVestingList);

    const userVesting = await vesting
      .connect(user)
      .getBeneficiaryVesting(await user.getAddress());

    expect(userVesting.beneficiary).to.equal(userAddress);
    expect(userVesting.vestingAmount).to.equal(ethers.BigNumber.from("10000"));

    const user2Vesting = await vesting
      .connect(user2)
      .getBeneficiaryVesting(await user2.getAddress());
    expect(user2Vesting.beneficiary).to.equal(user2Address);
    expect(user2Vesting.vestingAmount).to.equal(ethers.BigNumber.from("20000"));
  });

  it("Should not allow set vesting if vesting already exist", async () => {
    const userAddress = await user.getAddress();
    const user2Address = await user2.getAddress();
    const userVestingList = [
      {
        beneficiary: userAddress,
        vestingAmount: ethers.BigNumber.from("10000"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("100"),
        initialClaimed: false,
        claimStartTime: startTime + 2592000
      },
      {
        beneficiary: user2Address,
        vestingAmount: ethers.BigNumber.from("20000"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("200"),
        initialClaimed: false,
        claimStartTime: startTime + 2592000
      }
    ];

    await expect(
      vesting.connect(operator).setVesting(userVestingList)
    ).to.revertedWith("Vesting already exists");
  });

  it("Should not allow to claim before start date", async () => {
    await expect(vesting.connect(user).claim()).to.revertedWith(
      "Claim is not allowed before start"
    );
  });

  it("Should not allow set vesting if initialAmount and initialClaimed do not match", async () => {
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [startTime + 7200]
    });
    const user3Address = await user3.getAddress();
    const user4Address = await user4.getAddress();
    const userVestingList1 = [
      {
        beneficiary: user3Address,
        vestingAmount: ethers.BigNumber.from("1000"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("100"),
        initialClaimed: true,
        claimStartTime: startTime + 31556926 // 12 months
      }
    ];

    await expect(
      vesting.connect(operator).setVesting(userVestingList1)
    ).to.revertedWith("Initial claimed is not valid");

    const userVestingList2 = [
      {
        beneficiary: user4Address,
        vestingAmount: ethers.BigNumber.from("1010"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("0"),
        initialClaimed: false,
        claimStartTime: startTime + 31556926 // 12 months
      }
    ];

    await expect(
      vesting.connect(operator).setVesting(userVestingList2)
    ).to.revertedWith("Initial claimed is not valid");
  });

  it("Should allow operator to add vesting after claim start date", async () => {
    const user3Address = await user3.getAddress();
    const user4Address = await user4.getAddress();
    const userVestingList = [
      {
        beneficiary: user3Address,
        vestingAmount: ethers.BigNumber.from("1000"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("100"),
        initialClaimed: false,
        claimStartTime: startTime + 31556926 // 12 months
      },
      {
        beneficiary: user4Address,
        vestingAmount: ethers.BigNumber.from("1010"),
        duration: 31556926, //12 months
        claimedAmount: 0,
        lastClaimedTime: 0,
        initialAmount: ethers.BigNumber.from("0"),
        initialClaimed: true,
        claimStartTime: startTime + 31556926 // 12 months
      }
    ];

    await vesting.connect(operator).setVesting(userVestingList);

    const user3Vesting = await vesting
      .connect(user3)
      .getBeneficiaryVesting(user3Address);
    expect(user3Vesting.beneficiary).to.equal(user3Address);
    expect(user3Vesting.vestingAmount).to.equal(ethers.BigNumber.from("1000"));

    const user4Vesting = await vesting
      .connect(user4)
      .getBeneficiaryVesting(user4Address);
    expect(user4Vesting.beneficiary).to.equal(user4Address);
    expect(user4Vesting.vestingAmount).to.equal(ethers.BigNumber.from("1010"));
  });

  it("Should allow user to claim initial amount after claim started", async () => {
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [startTime + 2592000]
    });

    await vesting.connect(user).claim();
    const userBalanceAfter = await token.balanceOf(await user.getAddress());

    expect(userBalanceAfter).to.equal(ethers.BigNumber.from("100"));

    const userAddress = await user.getAddress();
    const vestingDetail = await vesting
      .connect(user)
      .getBeneficiaryVesting(userAddress);

    expect(ethers.utils.formatUnits(vestingDetail.lastClaimedTime, 0)).to.equal(
      (startTime + 2592000).toString()
    );
  });

  it("Should not allow user to claim linear before cliff", async () => {
    await expect(vesting.connect(user3).claim()).to.revertedWith(
      "Claim is not allowed before claim start date"
    );
  });

  it("Should allow user2 to claim initial amount with linear amount after start date", async () => {
    await vesting.connect(user2).claim();
    const user2BalanceAfter = await token.balanceOf(await user2.getAddress());

    expect(user2BalanceAfter).to.equal(ethers.BigNumber.from("200"));
  });

  it("Should allow user to claim linear after cliff", async () => {
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [startTime + 2592000 + 7200]
    });

    await vesting.connect(user).claim();
    const userBalanceAfter = await token.balanceOf(await user.getAddress());

    //(7200)* (10000-100)/31556926
    expect(userBalanceAfter).to.equal(ethers.BigNumber.from("102"));
  });

  it("Should allow user to claim rest of token after vesting period end", async () => {
    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [startTime + 31556926 + 2593000]
    });

    await vesting.connect(user).claim();
    const userBalanceAfter = await token.balanceOf(await user.getAddress());

    expect(userBalanceAfter).to.equal(ethers.BigNumber.from("10000"));


    await vesting.connect(user4).claim();
    const user4BalanceAfter = await token.balanceOf(await user4.getAddress());

    expect(user4BalanceAfter).to.equal(ethers.BigNumber.from("82"));

    await hre.network.provider.request({
      method: "evm_setNextBlockTimestamp",
      params: [startTime + 31556926 + 41556926]
    });

    await vesting.connect(user4).claim();
    const user4BalanceAfter2 = await token.balanceOf(await user4.getAddress());

    expect(user4BalanceAfter2).to.equal(ethers.BigNumber.from("1010"));
  });

  it("Should not allow more tokens than are in the contract", async () => {
    const contractBalance = await token.balanceOf(vesting.address);
    const totalClaimed = await vesting.totalClaimed();
    const totalVestingAmount = await vesting.totalVestingAmount();
    expect(contractBalance.gte(totalVestingAmount.sub(totalClaimed)));
  });
});
