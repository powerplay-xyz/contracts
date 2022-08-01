// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract REMI is ERC20 {
  using SafeERC20 for IERC20;

  constructor() ERC20("Renewable Energy Market Incentive", "REMI") {
    _mint(msg.sender, 10_000_000_000 * 10**decimals()); // 10 billion
  }

}
