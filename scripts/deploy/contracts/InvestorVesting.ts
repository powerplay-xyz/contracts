import { deployContract, sleep } from "../utils";
import { InvestorVesting } from "../../../build/typechain";
import { verifyOnEtherscan } from "../../tasks/verifyContractsEtherscan";
import contracts from "../../../contracts.json";
import hre, { ethers } from "hardhat";

export const contractNames = () => ["InvestorVesting"];

const tokenAddress = contracts[process.env.HARDHAT_NETWORK].REMI;
// Ensure this is a moment in the future!

const startDate = 1662127200;

const vestingSeed = [
  {
    beneficiary: "0x470D968F0d27075F3Db0f28d2C2a5a6EEbaD9E65",
    vestingAmount: ethers.BigNumber.from("750000000"),
    duration: 63072000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("300000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xb5408c2977daa3E371279b72bD598000db84d12a",
    vestingAmount: ethers.BigNumber.from("1115000000"),
    duration: 63072000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 15552000
  },
  {
    beneficiary: "0x6A378aFDd6Fc4387791992aA893FC6F9c7EC258b",
    vestingAmount: ethers.BigNumber.from("500000000"),
    duration: 63072000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("50000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xB5AA6A2BA240Bd900005F028716C837f2faaD95D",
    vestingAmount: ethers.BigNumber.from("500000000"),
    duration: 63072000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("50000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xACf1B2B00801Dd725Ee5393dd1E24ea74dDfBCEB",
    vestingAmount: ethers.BigNumber.from("3000000000"),
    duration: 157680000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0x6b441cC275D3088A62dD12609acEa6f446C645b6",
    vestingAmount: ethers.BigNumber.from("2000000000"),
    duration: 157680000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xD8C128747183AF6EbdA860A2ea9B77b3933c25b4",
    vestingAmount: ethers.BigNumber.from("500000000"),
    duration: 157680000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 31536000
  },
  {
    beneficiary: "0xfa0B65413E3E81FAF7321f85b2AfdD0EffF13Ef5",
    vestingAmount: ethers.BigNumber.from("350000000"),
    duration: 63072000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xfB98a42A0eb71470A9801e10E64B69f5A68e0024",
    vestingAmount: ethers.BigNumber.from("50000000"),
    duration: 31536000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("5000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0x73C2006262Ab12962120BEC17d1815A0EB845e76",
    vestingAmount: ethers.BigNumber.from("250000000"),
    duration: 31536000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("25000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xAec7D36147963706Dbc79e371f9Bcb822F10D60D",
    vestingAmount: ethers.BigNumber.from("50000000"),
    duration: 31536000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("5000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xd3a911E2586ABC81f0B1e6Ec5AfC61899dc816B9",
    vestingAmount: ethers.BigNumber.from("250000000"),
    duration: 31536000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("25000000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  },
  {
    beneficiary: "0xF2aE68ee7F461Ed24f96D089b6b48579EDbd7E4a",
    vestingAmount: ethers.BigNumber.from("60000000"),
    duration: 31536000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("0"),
    initialClaimed: true,
    claimStartTime: startDate + 31536000
  },
  {
    beneficiary: "0xb412F4978305bcD88e1703031166E714359B87Bc",
    vestingAmount: ethers.BigNumber.from("625000000"),
    duration: 31536000,
    claimedAmount: 0,
    lastClaimedTime: 0,
    initialAmount: ethers.BigNumber.from("62500000"),
    initialClaimed: false,
    claimStartTime: startDate + 0
  }
];

export const constructorArguments = () => [tokenAddress, startDate];

export const deploy = async (deployer, setAddresses) => {
  console.log("deploying InvestorVesting");
  const waitCount = 4;
  const investorVesting: InvestorVesting = (await deployContract(
    "InvestorVesting",
    constructorArguments(),
    deployer,
    waitCount
  )) as InvestorVesting;
  console.log(`deployed InvestorVesting to address ${investorVesting.address}`);
  setAddresses({ InvestorVesting: investorVesting.address });
  console.log("Verifying InvestorVesting on Etherscan");
  await sleep(10000);
  await verifyOnEtherscan(investorVesting.address, constructorArguments(), hre);
  console.log("Setting up vesting seeds");
  //Set vesting seed after deploy the contract
  const tx = await (await investorVesting.setVesting(vestingSeed)).wait();
  console.log(`setVesting tx: ${tx.transactionHash}`);
  return investorVesting;
};
