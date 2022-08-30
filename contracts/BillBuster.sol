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

  uint256 private _totalStaked;

  address private taxAddress = address(0x470D968F0d27075F3Db0f28d2C2a5a6EEbaD9E65);

  // Number of tokens in the contract per address
  mapping(address => uint256) private _balances;

  // Token to be used in this contract
  address public token;

  event ToggleWaiveFees(bool _status);

  event UpdateTaxAddress(address _address);

  event SetTaxFee(uint256 _fee, uint256 _decimals);

  event Deposit(address indexed from, uint256 value);

  event Withdraw(address indexed to, uint256 value);

  constructor(address _token) {
    require(_token != address(0), "Address cannot be zero");
    token = _token;
    // set the Tax fee to be 0.5%
    setTaxFee(5, 1);
  }

  /// @notice Sets the fee percentage for the Tax fund
  function setTaxFee(uint256 fee, uint256 feeDecimals) public onlyOwner {
      require(fee > 0, "The Tax fee must be greater than 0");
      if (feeDecimals == 0) {
          // If the feeDecimals is greater than 0 then the percent is less then 5%
          require(fee <= 5, "The Tax fee must be less than 5%");
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

  /// @notice Updates the tax contract address
  function updateTaxAddress(address newAddress) external onlyOwner {
      require(taxAddress != newAddress, "New address cannot be the same");
      require(newAddress != address(0), "The address cannot be the zero address");
      taxAddress = newAddress;
      emit UpdateTaxAddress(taxAddress);
  }

  /// @notice Number of tokens to hold as the fee
  /// @notice With the default fee of 0.5% no tax will be applied to withdrawals under 1000 RETA due to the limitations of integer maths.
  function calculateFee(
      uint256 _amount,
      uint256 _feePercentage,
      uint256 _feeDecimals
  ) public pure returns (uint256) {
      uint256 numerator = _amount * _feePercentage;
      // 2, because e.g. 1% = 1 * 10^-2 = 0.01
      uint256 denominator = 10**(_feeDecimals + 2);
      require(denominator > 0, "Denominator cannot be zero");
      return numerator / denominator;
  }

  /// @notice Calculate the number of tokens the Tax should take and transfer it to the Tax fund
  function transferTax(uint256 amount) private returns (uint256 remainder) {
  uint256 _remainder = amount;
  if (!waiveFees) {
      uint256 tokensForTax;
      tokensForTax = calculateFee(amount, taxFee, taxFeeDecimals);
      _remainder -= tokensForTax;
      ERC20(token).safeTransfer(taxAddress, tokensForTax);
  }
  return _remainder;
  }

  /// @notice Gets balance of the number of tokens an address has in the contract
  function getBalance(address _owner) public view returns (uint256) {
    return _balances[_owner];
  }

  /// @notice The total staked value in the contract
  function totalStaked() public view returns (uint256) {
    return _totalStaked;
  }

  /// @notice Deposit tokens to the contract
  function deposit(uint256 _amount) public {
    require(_amount > 0, "Amount must be greater than 0");
    _totalStaked += _amount;
    _balances[msg.sender] += _amount;
    ERC20(token).safeTransferFrom(msg.sender, address(this), _amount);
    emit Deposit(msg.sender, _amount);
  }

  /// @notice Withdraw tokens from the contract
  function withdraw(uint256 _amount) public {
    require(_amount > 0, "Amount must be greater than 0");
    uint256 _balance = _balances[msg.sender];
    require( _balance >= _amount, "Withdrawal amount exceeds held balance");
    _totalStaked -= _amount;
    _balances[msg.sender] = _balance - _amount;
    // calculate the number of tokens the Tax should take
    uint256 remainder = transferTax(_amount);

    ERC20(token).safeTransfer(msg.sender, remainder);
    emit Withdraw(msg.sender, _amount);
  }

}
