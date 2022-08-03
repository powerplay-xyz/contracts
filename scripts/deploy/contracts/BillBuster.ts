import { deployContract } from "../utils";
import { BillBuster } from "../../../build/typechain";

export const contractNames = () => ["BillBuster"];

export const constructorArguments = () => [
  "0xd9BAcC5BccAd9A380001d41Cd234b4D5f33ece76"
];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying BillBuster");
  const billBuster: BillBuster = (await deployContract(
    "BillBuster",
    constructorArguments(),
    deployer,
    1
  )) as BillBuster;
  console.log(`deployed BillBuster to address ${billBuster.address}`);
  setAddresses({ billBuster: billBuster.address });
  return billBuster;
};
