// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RETA is ERC20, AccessControl {
  using SafeERC20 for IERC20;

  address communityAddress;
  uint256 public communityFee;
  uint256 public communityFeeDecimals;

  address platformDevAddress;
  uint256 public platformDevFee;
  uint256 public platformDevFeeDecimals;

  address tokenFarmAddress;
  uint256 public tokenFarmFee;
  uint256 public tokenFarmFeeDecimals;

  address teamAddress;
  uint256 public teamFee;
  uint256 public teamFeeDecimals;

  bool public waiveFees;

  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
  bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");

  event toggleWaiveFees(string _status);

  mapping(address => bool) public whitelist;

  modifier onlyValidAddress(address wallet) {
    require(wallet != address(0), "The address cannot be the zero address");
    require(wallet != msg.sender, "The address cannot be the sender");
    require(wallet != communityAddress, "The address cannot be the community");
    require(
      wallet != platformDevAddress,
      "The address cannot be the platformDev"
    );
    require(wallet != address(this), "The address cannot be the contract");
    _;
  }

  modifier onlyAdmin() {
    require(
      hasRole(ADMIN_ROLE, msg.sender) || hasRole(OWNER_ROLE, msg.sender),
      "Address does not have admin permission"
    );
    _;
  }

  modifier onlyOwner() {
    require(
      hasRole(OWNER_ROLE, msg.sender),
      "Address does not have owner permission"
    );
    _;
  }

  constructor(
    address _communityAddress,
    address _platformDevAddress,
    address _tokenFarmAddress,
    address _teamAddress
  ) ERC20("Renewable Energy Transition Accelerator", "RETA") {
    _setupRole(OWNER_ROLE, msg.sender);
    _setRoleAdmin(ADMIN_ROLE, OWNER_ROLE);
    _mint(msg.sender, 10000000000 * 10**decimals()); // 10 billion

    communityAddress = _communityAddress;
    platformDevAddress = _platformDevAddress;
    tokenFarmAddress = _tokenFarmAddress;
    teamAddress = _teamAddress;

    // Just asssume transaction levy to be a total of 2% for the moment

    // set the Community fee to be 0.6% (30% of 2%)
    setCommunityFee(6, 1);
    // set the platformDev fee to be 0.6% (30% of 2%)
    setPlatformDevFee(6, 1);
    // set the platformDev fee to be 0.6% (30% of 2%)
    setTokenFarmFee(6, 1);
    // set the platformDev fee to be 0.2% (10% of 2%)
    setTeamFee(2, 1);
  }

  // Sets the fee percentage for the RETA Community fund
  function setCommunityFee(uint256 fee, uint256 feeDecimals) public onlyAdmin {
    require(fee >= 0, "The RETA Community fee must be greater than 0");

    communityFee = fee;
    communityFeeDecimals = feeDecimals;
  }

  // Sets the fee percentage for the platformDev wallet
  function setPlatformDevFee(uint256 fee, uint256 feeDecimals)
    public
    onlyAdmin
  {
    require(fee >= 0, "The RETA platformDev fee must be greater than 0");

    platformDevFee = fee;
    platformDevFeeDecimals = feeDecimals;
  }

  // Sets the fee percentage for the platformDev wallet
  function setTokenFarmFee(uint256 fee, uint256 feeDecimals) public onlyAdmin {
    require(fee >= 0, "The RETA tokenFarm fee must be greater than 0");

    tokenFarmFee = fee;
    tokenFarmFeeDecimals = feeDecimals;
  }

  // Sets the fee percentage for the platformDev wallet
  function setTeamFee(uint256 fee, uint256 feeDecimals) public onlyAdmin {
    require(fee >= 0, "The RETA Team fee must be greater than 0");

    teamFee = fee;
    teamFeeDecimals = feeDecimals;
  }

  // Toggles the in-built transaction fee on and off for all transactions
  function toggleTransactionFees() public onlyAdmin {
    waiveFees = !waiveFees;
    emit toggleWaiveFees(waiveFees ? "on" : "off");
  }

  // has a wallet been whitelisted?
  function whitelisted(address wallet) public view returns (bool) {
    return whitelist[wallet];
  }

  // add a wallet address to the whitelist
  function exemptFromFee(address wallet)
    public
    onlyAdmin
    onlyValidAddress(wallet)
  {
    whitelist[wallet] = true;
  }

  // remove a wallet address from the whitelist
  function includeInFee(address wallet)
    public
    onlyAdmin
    onlyValidAddress(wallet)
  {
    whitelist[wallet] = false;
  }

  // update the community contract address
  function updateRETAVaultAddress(address newAddress) public onlyAdmin {
    require(communityAddress != newAddress, "New address cannot be the same");
    communityAddress = newAddress;
  }

  // update the platformDev wallet address
  function updateFoundationAddress(address newAddress) public onlyAdmin {
    platformDevAddress = newAddress;
  }

  // number of tokens to hold as the fee
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

  function transfer(address to, uint256 amount) public override returns (bool) {
    require(amount > 0, "The amount must be greater than 0");

    uint256 tokensForCommunity;
    uint256 tokensForPlatformDev;
    uint256 tokensForTokenFarm;
    uint256 tokensForTeam;

    uint256 remainder = amount;

    // calculate the number of tokens the Community should take
    if (!whitelist[to] && !whitelist[msg.sender] && !waiveFees) {
      tokensForCommunity = calculateFee(
        amount,
        communityFee,
        communityFeeDecimals
      );
      remainder -= tokensForCommunity;

      // calculate the number of tokens the Foundation should take
      tokensForPlatformDev = calculateFee(
        amount,
        platformDevFee,
        platformDevFeeDecimals
      );
      remainder -= tokensForPlatformDev;

      tokensForTokenFarm = calculateFee(
        amount,
        tokenFarmFee,
        tokenFarmFeeDecimals
      );
      remainder -= tokensForTokenFarm;

      tokensForTeam = calculateFee(amount, teamFee, teamFeeDecimals);
      remainder -= tokensForTeam;
    }

    super.transfer(communityAddress, tokensForCommunity);
    super.transfer(platformDevAddress, tokensForPlatformDev);
    super.transfer(tokenFarmAddress, tokensForTokenFarm);
    super.transfer(teamAddress, tokensForTeam);
    super.transfer(to, remainder);
    return true;
  }

  function setAdmin(address admin) public onlyOwner {
    grantRole(ADMIN_ROLE, admin);
  }

  function transferOwnership(address owner) public onlyOwner {
    grantRole(OWNER_ROLE, owner);
    revokeRole(OWNER_ROLE, msg.sender);
  }
}
