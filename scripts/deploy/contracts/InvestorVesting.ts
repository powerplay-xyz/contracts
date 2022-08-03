import { deployContract } from "../utils";
import { InvestorVesting } from "../../../build/typechain";

export const contractNames = () => ["InvestorVesting"];

const tokenAddress = "0xd9BAcC5BccAd9A380001d41Cd234b4D5f33ece76";
const startDate = 1659560482;
const maxVestingDetailArray = 20;

export const constructorArguments = () => [
  tokenAddress,
  startDate,
  maxVestingDetailArray
];

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
  return investorVesting;
};
