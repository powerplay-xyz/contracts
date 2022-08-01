// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BillBuster is Ownable {
  using SafeERC20 for ERC20;

  uint256 public taxFee;

  uint256 public taxFeeDecimals;

  bool public waiveFees;

  event ToggleWaiveFees(bool _status);

  event SetTaxFee(uint256 _fee, uint256 _decimals);

  event Deposit(address indexed from, uint256 value);

  event Withdraw(address indexed to, uint256 value);

  // Number of tokens in the contract per address
  mapping(address => uint256) private _balances;
  // Token to be used in this contract
  address public token;


  constructor(address _token) {
    token = _token;
  }

  /// @notice Sets the fee percentage for the B4REAL Tax fund
  function setTaxFee(uint256 fee, uint256 feeDecimals) public onlyOwner {
      require(fee > 0, "The Tax fee must be greater than 0");
      if (feeDecimals == 0) {
          // If the feeDecimals is greater than 0 then the percent is less then 100%
          require(fee < 100, "The B4REAL Tax fee must be less than 100");
      }
      taxFee = fee;
      taxFeeDecimals = feeDecimals;
      emit SetTaxFee(fee, feeDecimals);
  }

  /// @notice Toggles the in-built transaction fee on and off for all transactions
  function toggleTransactionFees() external onlyOwner {
      waiveFees = !waiveFees;
      emit ToggleWaiveFees(waiveFees);
  }

  function getBalance(address _owner) public view returns (uint256) {
    return _balances[_owner];
  }

  // Deposit tokens to the contract
  function deposit(uint256 _amount) public {
    require(ERC20(token).allowance(msg.sender, address(this)) >= _amount, "Not enough allowance");

    ERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    _balances[msg.sender] += _amount;
    emit Deposit(msg.sender, _amount);
  }

  // Withdraw tokens to the contract
  function withdraw(uint256 _amount) public {
    uint256 _balance = _balances[msg.sender];
    require( _balance >= _amount, "Withdrawal amount exceeds held balance");

    _balances[msg.sender] = _balance - _amount;

    ERC20(token).safeTransfer(msg.sender, _amount);

    emit Withdraw(msg.sender, _amount);
  }

}
