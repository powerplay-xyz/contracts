import { ethers as tsEthers } from "ethers";
import * as Token from "./Token";
import * as BillBuster from "./BillBuster";

export interface DeploymentModule {
  contractNames: (...params: any) => string[];
  constructorArguments: (addresses?: any) => any[];
  deploy: (
    deployer: tsEthers.Signer,
    setAddresses: Function,
    addresses?: any
  ) => Promise<tsEthers.Contract>;
  upgrade?: (deployer: tsEthers.Signer, addresses?: any) => void;
}

const modules: DeploymentModule[] = [BillBuster, Token];

export default modules;
