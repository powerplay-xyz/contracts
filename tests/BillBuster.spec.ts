import { ethers } from "hardhat";
import { BigNumber, ethers as tsEthers } from "ethers";
import { assert, expect } from "chai";
import {
  BillBuster,
  BillBuster__factory,
  REMI,
  REMI__factory
} from "../build/typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

let billBuster: BillBuster;
let remi: REMI;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;

const TAX_FEE = ethers.BigNumber.from("5");
const TAX_FEE_DECIMALS = ethers.BigNumber.from("1");
const TAX_ADDRESS = "0x470D968F0d27075F3Db0f28d2C2a5a6EEbaD9E65";

describe("Bill Buster", () => {
  before(async () => {
    const [deployer] = await ethers.getSigners();
    remi = await new REMI__factory(deployer).deploy();
    billBuster = await new BillBuster__factory(deployer).deploy(remi.address);
  });

  beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
  });

  it("Should return the correct token address", async () => {
    expect(await billBuster.token()).to.equal(remi.address);
  });

  it("Should get the correct fee setup after contract deployment", async () => {
    expect(await billBuster.waiveFees()).to.equal(false);
    expect(await billBuster.taxFee()).to.equal(TAX_FEE);
    expect(await billBuster.taxFeeDecimals()).to.equal(TAX_FEE_DECIMALS);
  });

  it("Should not allow a non owner to setup fees", async () => {
    const contract = await billBuster.connect(user1);
    await expect(contract.toggleTransactionFees()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
    await expect(
      contract.setTaxFee(TAX_FEE, TAX_FEE_DECIMALS)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(contract.toggleTransactionFees()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("Should only allow owner to setup fees", async () => {
    const contract = await billBuster.connect(owner);
    await expect(
      contract.updateTaxAddress("0x3b09A467f139EDa93a72DaA23341843fE4753ACa")
    )
      .to.emit(billBuster, "UpdateTaxAddress")
      .withArgs("0x3b09A467f139EDa93a72DaA23341843fE4753ACa");

    await expect(
      contract.setTaxFee(ethers.BigNumber.from("1"), ethers.BigNumber.from("0"))
    )
      .to.emit(billBuster, "SetTaxFee")
      .withArgs(ethers.BigNumber.from("1"), ethers.BigNumber.from("0"));

    await expect(contract.toggleTransactionFees())
      .to.emit(billBuster, "ToggleWaiveFees")
      .withArgs(true);
  });
});

describe("Bill Buster deposits", () => {
  before(async () => {
    const [deployer] = await ethers.getSigners();
    remi = await new REMI__factory(deployer).deploy();
    billBuster = await new BillBuster__factory(deployer).deploy(remi.address);
  });

  beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();
    const contract = await remi.connect(owner);
    await contract.transfer(user1.address, ethers.BigNumber.from("1001"));
  });

  it("Should not allow a deposit if there is not enough allowance", async () => {
    const contract = await billBuster.connect(user1);
    await expect(
      contract.deposit(ethers.BigNumber.from("1"))
    ).to.be.revertedWith("Not enough allowance");
    const token = await remi.connect(user1);
    await token.approve(billBuster.address, ethers.BigNumber.from("100"));
    await expect(
      contract.deposit(ethers.BigNumber.from("101"))
    ).to.be.revertedWith("Not enough allowance");
  });

  it("Should allow a deposit if there is enough allowance", async () => {
    const amount = ethers.BigNumber.from("100");
    const contract = await billBuster.connect(user1);
    const token = await remi.connect(user1);

    await token.approve(billBuster.address, amount);
    await expect(contract.deposit(amount))
      .to.emit(billBuster, "Deposit")
      .withArgs(user1.address, amount);

    expect(await contract.getBalance(user1.address)).to.equal(amount);
    expect(await contract.totalStaked()).to.equal(amount);
    expect(await token.balanceOf(billBuster.address)).to.equal(amount);

    await token.approve(billBuster.address, amount);
    await expect(contract.deposit(amount))
      .to.emit(billBuster, "Deposit")
      .withArgs(user1.address, amount);

    expect(await contract.getBalance(user1.address)).to.equal(amount.mul(2));
    expect(await contract.totalStaked()).to.equal(amount.mul(2));
    expect(await token.balanceOf(billBuster.address)).to.equal(amount.mul(2));
  });
});

describe("Bill Buster withdrawals", () => {
  before(async () => {
    const [deployer] = await ethers.getSigners();
    remi = await new REMI__factory(deployer).deploy();
    billBuster = await new BillBuster__factory(deployer).deploy(remi.address);

    [owner, user1, user2, user3] = await ethers.getSigners();
    const amount = ethers.utils.parseEther("1000");
    const token1 = await remi.connect(owner);
    await token1.transfer(user1.address, ethers.utils.parseEther("1001"));

    const token2 = await remi.connect(user1);
    await token2.approve(billBuster.address, amount);
    const contract = await billBuster.connect(user1);
    await expect(contract.deposit(amount))
      .to.emit(billBuster, "Deposit")
      .withArgs(user1.address, amount);
  });

  it("Should not allow a withdrawal if the withdrawal amount is greater then held assests", async () => {
    const contract1 = await billBuster.connect(user2);
    await expect(
      contract1.withdraw(ethers.utils.parseEther("1"))
    ).to.be.revertedWith("Withdrawal amount exceeds held balance");
    const contract2 = await billBuster.connect(user1);
    await expect(
      contract2.withdraw(ethers.utils.parseEther("1001"))
    ).to.be.revertedWith("Withdrawal amount exceeds held balance");
  });

  it("Should allow a withdrawal and apply tax if the withdrawal amount is less or equal too the held assests and waiveFees is false", async () => {
    // With the default fee of 0.5% no tax will be applied to withdrawals under 1000 wei RETA due to the limitations of integer maths.
    const contract = await billBuster.connect(user1);
    const token = await remi.connect(user1);

    const amount = ethers.utils.parseEther("100");
    const taxAmount = ethers.utils.parseEther("0.5");

    const withdrawalRemainer = amount
      .sub(taxAmount)
      .add(ethers.utils.parseEther("1"));

    await expect(contract.withdraw(amount))
      .to.emit(billBuster, "Withdraw")
      .withArgs(user1.address, amount);

    expect(await contract.getBalance(user1.address)).to.equal(
      ethers.utils.parseEther("900")
    );
    expect(await token.balanceOf(billBuster.address)).to.equal(
      ethers.utils.parseEther("900")
    );
    expect(await token.balanceOf(user1.address)).to.equal(withdrawalRemainer);
    expect(await token.balanceOf(TAX_ADDRESS)).to.equal(taxAmount);
  });

  it("Should allow a withdrawal and NOT apply tax if the withdrawal amount is less or equal too the held assests and waiveFees is true", async () => {
    const contractOwened = await billBuster.connect(owner);

    await expect(contractOwened.toggleTransactionFees())
      .to.emit(billBuster, "ToggleWaiveFees")
      .withArgs(true);
    // With the default fee of 0.5% no tax will be applied to withdrawals under 1000 wei RETA due to the limitations of integer maths.
    const contract = await billBuster.connect(user1);
    const token = await remi.connect(user1);

    const amount = ethers.utils.parseEther("100");
    const taxAmount = ethers.utils.parseEther("0.5");

    const withdrawen = amount.add(await token.balanceOf(user1.address));

    await expect(contract.withdraw(amount))
      .to.emit(billBuster, "Withdraw")
      .withArgs(user1.address, amount);

    expect(await contract.getBalance(user1.address)).to.equal(
      ethers.utils.parseEther("800")
    );
    expect(await token.balanceOf(billBuster.address)).to.equal(
      ethers.utils.parseEther("800")
    );
    expect(await token.balanceOf(user1.address)).to.equal(withdrawen);
    expect(await token.balanceOf(TAX_ADDRESS)).to.equal(taxAmount);
  });
});
