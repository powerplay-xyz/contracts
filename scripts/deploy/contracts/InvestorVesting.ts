import { deployContract, sleep } from "../utils";
import { InvestorVesting } from "../../../build/typechain";
import { verifyOnEtherscan } from "../../tasks/verifyContractsEtherscan";
import hre, { ethers } from "hardhat";

export const contractNames = () => ["InvestorVesting"];

const tokenAddress = "0xd9BAcC5BccAd9A380001d41Cd234b4D5f33ece76";
const startDate = 1659666444;

const vestingSeed = [
  {
    beneficiary: "0x14a09AFAaD55649571B59006060B7D1A6a9c2bA5",
    vestingAmount: ethers.BigNumber.from("10000"),
    duration: 3600,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("100"),
    initialClaimed: false,
    claimStartTime: startDate + 3600
  },
  {
    beneficiary: "0x18a5ff44dcc65e8bFD01F48496f8f4Be6980CaA9",
    vestingAmount: ethers.BigNumber.from("20000"),
    duration: 3600,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("200"),
    initialClaimed: false,
    claimStartTime: startDate + 3600
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
  await sleep(5000);
  await verifyOnEtherscan(investorVesting.address, constructorArguments(), hre);
  console.log("Setting up vesting seeds");
  //Set vesting seed after deploy the contract
  const tx = await (await investorVesting.setVesting(vestingSeed)).wait();
  console.log(`setVesting tx: ${tx}`);
  return investorVesting;
};
