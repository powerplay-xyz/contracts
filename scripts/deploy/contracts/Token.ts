import { deployContract } from "../utils";
import { ERC20 } from "../../../build/typechain";

export const contractNames = () => ["REMI"];

export const constructorArguments = () => [];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying REMI");
  const token: ERC20 = (await deployContract(
    "REMI",
    constructorArguments(),
    deployer,
    1
  )) as ERC20;
  console.log(`deployed REMI to address ${token.address}`);
  setAddresses({ token: token.address });
  return token;
};
