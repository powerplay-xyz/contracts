import { deployContract, sleep } from "../utils";
import { BillBuster } from "../../../build/typechain";
import { verifyOnEtherscan } from "../../tasks/verifyContractsEtherscan";
import hre, { ethers } from "hardhat";

export const contractNames = () => ["BillBuster"];

export const constructorArguments = () => [
  "0xd9BAcC5BccAd9A380001d41Cd234b4D5f33ece76"
];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying BillBuster");
  const bb: BillBuster = (await deployContract(
    "BillBuster",
    constructorArguments(),
    deployer,
    3
  )) as BillBuster;
  console.log(`deployed BillBuster to address ${bb.address}`);
  setAddresses({ BillBuster: bb.address });
  console.log("Verifying BillBuster on Etherscan");
  await sleep(10000);
  await verifyOnEtherscan(bb.address, constructorArguments(), hre);
  return bb;
};
