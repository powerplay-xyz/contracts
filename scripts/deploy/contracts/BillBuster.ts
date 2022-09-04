import { deployContract, sleep } from "../utils";
import { BillBuster } from "../../../build/typechain";
import { verifyOnEtherscan } from "../../tasks/verifyContractsEtherscan";
import contracts from "../../../contracts.json";
import hre, { ethers } from "hardhat";

export const contractNames = () => ["BillBuster"];

export const constructorArguments = () => [
  contracts[process.env.HARDHAT_NETWORK].REMI
];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying BillBuster");
  const bb: BillBuster = (await deployContract(
    "BillBuster",
    constructorArguments(),
    deployer,
    4
  )) as BillBuster;
  console.log(`deployed BillBuster to address ${bb.address}`);
  setAddresses({ BillBuster: bb.address });
  console.log("Verifying BillBuster on Etherscan");
  await sleep(10000);
  await verifyOnEtherscan(bb.address, constructorArguments(), hre);
  return bb;
};
