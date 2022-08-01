import { deployContract } from "../utils";
import { ERC20 } from "../../../build/typechain";

export const contractNames = () => ["token"];

export const constructorArguments = () => [];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying Token");
  const token: ERC20 = (await deployContract(
    "Token",
    constructorArguments(),
    deployer,
    1
  )) as ERC20;
  console.log(`deployed Token to address ${token.address}`);
  setAddresses({ token: token.address });
  return token;
};
