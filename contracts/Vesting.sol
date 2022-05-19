// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vesting is Ownable {
    using SafeERC20 for ERC20;

    address public token; //= 0x8Ef9B898db563d3c6175c2CDdfCe5027C36380fc;
    uint256 private immutable start;
    // NOTE: Don't forget to add this contract address to the whitelisted addresses
    address public constant funding_seed1 =
        0x73C2006262Ab12962120BEC17d1815A0EB845e76;
    address public constant paulAntonelli =
        0xfB98a42A0eb71470A9801e10E64B69f5A68e0024;
    address public constant dev =
        0xfa0B65413E3E81FAF7321f85b2AfdD0EffF13Ef5;
    address public constant team =
        0xb5408c2977daa3E371279b72bD598000db84d12a;
    address public constant future =
        0xACf1B2B00801Dd725Ee5393dd1E24ea74dDfBCEB;
    address public constant incentives =
        0x6A378aFDd6Fc4387791992aA893FC6F9c7EC258b;
    address public constant intExpansion =
        0x177ccDec7aDaaC034b05C7F35Af9fe325928a456;
    address public constant treasury =
        0x470D968F0d27075F3Db0f28d2C2a5a6EEbaD9E65;

    // Total amount of funds to be vested for each user/use case
    uint256 public constant funding_seed1VestingCap = 250_000_000 * 1e18;
    uint256 public constant paulAntonelliVestingCap = 50_000_000 * 1e18;
    uint256 public constant devVestingCap = 350_000_000 * 1e18;
    uint256 public constant teamVestingCap = 1_000_000_000 * 1e18;
    uint256 public constant futureVestingCap = 2_000_000_000 * 1e18;
    uint256 public constant incentivesVestingCap = 600_000_000 * 1e18;
    uint256 public constant intExpansionVestingCap = 500_000_000 * 1e18;
    uint256 public constant treasuryVestingCap = 200_000_000 * 1e18;

    // Vesting intervals
    uint256 public constant funding_seed1VestingTime = 7 days;
    uint256 public constant paulAntonelliVestingTime = 7 days;
    uint256 public constant devVestingTime = 7 days;
    uint256 public constant teamVestingTime = 26 weeks;
    uint256 public constant futureVestingTime = 4 weeks;
    uint256 public constant incentivesVestingTime = 7 days;
    uint256 public constant intExpansionVestingTime = 4 weeks;
    uint256 public constant treasuryVestingTime = 7 days;

    // Vesting amount per interval
    uint256 public constant funding_seed1VestingAmount = 4_326_924;
    uint256 public constant paulAntonelliVestingAmount = 865_385;
    uint256 public constant devVestingAmount = 3_365_385;
    uint256 public constant teamVestingAmount = 250_000_000;
    uint256 public constant futureVestingAmount = 30_000_000;
    uint256 public constant incentivesVestingAmount = 5_192_308;
    uint256 public constant intExpansionVestingAmount = 8_333_334;
    uint256 public constant treasuryVestingAmount = 1_730_770;

    // Vesting amount for first interval
    uint256 public constant funding_seed1InitVesting = 25_000_000;
    uint256 public constant paulAntonelliInitVesting = 5_000_000;
    uint256 public constant devInitVesting = devVestingAmount;
    uint256 public constant teamInitVesting = teamVestingAmount;
    uint256 public constant futureInitVesting = 200_000_000;
    uint256 public constant incentivesInitVesting = 60_000_000;
    uint256 public constant intExpansionInitVesting = intExpansionVestingAmount;
    uint256 public constant treasuryInitVesting = 20_000_000;

    mapping(address => uint256) public lastClaim;
    mapping(address => uint256) public claimed;

    constructor(address _token, uint256 _start) {
        require(_token != address(0), "Token address cannot be 0");
        uint256 startTime = _start;
        start = startTime;
        lastClaim[dev] = startTime;
        lastClaim[team] = startTime;
        lastClaim[intExpansion] = startTime;
        // No claims for 6 months, and claims every week
        lastClaim[future] = startTime + 175 days;

        // Turn back vesting time to allow initial vesting
        lastClaim[funding_seed1] = startTime - 7 days;
        lastClaim[paulAntonelli] = startTime - 7 days;
        lastClaim[incentives] = startTime - 7 days;
        lastClaim[treasury] = startTime - 7 days;
        token = _token;
    }

    function _vestCalc(address who, uint256 initialVestingAmount, uint vestingAmount, uint256 vestingCap) private returns (bool) {
        require(who != address(0), "Cannot claim from address 0");
        require(initialVestingAmount > 0, "Cannot claim 0 tokens");
        require(initialVestingAmount <= vestingCap, "Cannot claim more than vesting cap");

        uint256 claimedAmount;
        if (claimed[who] == 0) {
            // First Vesting Claim
            claimedAmount = initialVestingAmount * 1e18;
        } 
        // If the claim amount is greater than the remaining amount owed, return the remaining amount owed
        else if (claimed[who] + (vestingAmount * 1e18) > vestingCap) {
            uint256 finalClaim = vestingCap - claimed[who];
            claimedAmount = finalClaim;
        } 
        // Otherwise, return the standard vesting amount
        else {
            claimedAmount = vestingAmount * 1e18;
        }
        return _vest(who, claimedAmount);
    }

    function _vest(address who, uint256 amount) private returns (bool) {
        require(amount > 0, "Cannot claim 0 tokens");

        lastClaim[who] = block.timestamp;
        claimed[who] += amount;
        ERC20(token).safeTransfer(who, amount);

        return true;
    }

    function claim() external returns (bool) {

        // Vesting for funding_seed1
        if (
            msg.sender == funding_seed1 &&
            lastClaim[funding_seed1] + funding_seed1VestingTime < block.timestamp
        ) {
            return _vestCalc(funding_seed1, funding_seed1InitVesting, funding_seed1VestingAmount, funding_seed1VestingCap);
        }

        // Vesting for paulAntonelli
        if (
            msg.sender == paulAntonelli &&
            lastClaim[paulAntonelli] + paulAntonelliVestingTime < block.timestamp
        ) {
            return _vestCalc(paulAntonelli, paulAntonelliInitVesting, paulAntonelliVestingAmount, paulAntonelliVestingCap);
        }

        // Vesting for incentives
        if (
            msg.sender == incentives &&
            lastClaim[incentives] + incentivesVestingTime < block.timestamp
        ) {
            return _vestCalc(incentives, incentivesInitVesting, incentivesVestingAmount, incentivesVestingCap);
        }

        // Vesting for devs
        if (
            msg.sender == dev &&
            lastClaim[dev] + devVestingTime < block.timestamp
        ) {
            return _vestCalc(dev, devInitVesting, devVestingAmount, devVestingCap);
        }

        // Vesting for treasury
        if (
            msg.sender == treasury &&
            lastClaim[treasury] + treasuryVestingTime < block.timestamp
        ) {
            return _vestCalc(treasury, treasuryInitVesting, treasuryVestingAmount, treasuryVestingCap);
        }

        // Vesting for team
        if (
            msg.sender == team &&
            lastClaim[team] + teamVestingTime < block.timestamp

        ) {
            return _vestCalc(team, teamInitVesting, teamVestingAmount, teamVestingCap);
        }

        // Vesting for future
        if (
            msg.sender == future &&
            lastClaim[future] + futureVestingTime < block.timestamp
        ) {
            return _vestCalc(future, futureInitVesting, futureVestingAmount, futureVestingCap);
        }

        // Vesting for intExpansion
        if (
            msg.sender == intExpansion &&
            lastClaim[intExpansion] + intExpansionVestingTime < block.timestamp
        ) {
            return _vestCalc(intExpansion, intExpansionInitVesting, intExpansionVestingAmount, intExpansionVestingCap);
        }
        return false;
    }
}
