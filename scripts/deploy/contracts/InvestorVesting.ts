import { deployContract, sleep } from "../utils";
import { InvestorVesting } from "../../../build/typechain";
import { verifyOnEtherscan } from "../../tasks/verifyContractsEtherscan";
import hre, { ethers } from "hardhat";

export const contractNames = () => ["InvestorVesting"];

const tokenAddress = "0xd9BAcC5BccAd9A380001d41Cd234b4D5f33ece76";
const startDate = 1660194727;

const vestingSeed = [
  {
    beneficiary: "0x042BC2D085c0584Bd56D62C170C4679e1ee9FC45",
    vestingAmount: ethers.BigNumber.from("11150000"),
    duration: 9000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 1800
  },
  {
    beneficiary: "0xd7016BBF436fea30f2a50eF0D56397a983be4129",
    vestingAmount: ethers.BigNumber.from("5000000"),
    duration: 7200,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("500000"),
    initialClaimed: false,
    claimStartTime: startDate
  },
  {
    beneficiary: "0xEBE3efcfD01e27c1Ea8E48f5d55550C6325237af",
    vestingAmount: ethers.BigNumber.from("30000000"),
    duration: 18000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate
  }
];

export const constructorArguments = () => [tokenAddress, startDate];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying InvestorVesting");
  const investorVesting: InvestorVesting = (await deployContract(
    "InvestorVesting",
    constructorArguments(),
    deployer,
    1
  )) as InvestorVesting;
  console.log(`deployed InvestorVesting to address ${investorVesting.address}`);
  setAddresses({ InvestorVesting: investorVesting.address });
  console.log("Verifying InvestorVesting on Etherscan");
  // Wait for a bit for etherscan to pick up the contract.
  await sleep(15000);
  await verifyOnEtherscan(investorVesting.address, constructorArguments(), hre);
  console.log("Setting up vesting seeds");
  //Set vesting seed after deploy the contract
  const tx = await (await investorVesting.setVesting(vestingSeed)).wait();
  console.log(`setVesting tx: ${tx.transactionHash}`);
  return investorVesting;
};
