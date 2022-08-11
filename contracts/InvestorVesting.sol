// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

struct VestingDetail {
    //Vestor address
    address beneficiary;
    // Amount to be vested.
    uint256 vestingAmount;
    // Vesting duration, after cliff.
    uint256 duration;
    // Amount already claimed by beneficiary.
    uint256 claimedAmount;
    // Time at which beneficiary last claimed.
    uint256 lastClaimedTime;
    // Initial amount to be claimed, included in vestingAmount.
    uint256 initialAmount;
    // Whether the initialAmount value was claimed.
    bool initialClaimed;
    // Time at which vesting begins.
    uint256 claimStartTime;
}

interface IInvestor {
    function setVesting(VestingDetail[] calldata _vestingDetails) external;
    function claim() external;
}

contract InvestorVesting is IInvestor, Ownable {
    using SafeERC20 for ERC20;

    address public immutable token;
    uint256 public startDate;
    uint256 public totalClaimed;
    uint256 public totalVestingAmount;
    //Maximum number of vesting details
    uint256 private constant maxVestingDetailArray = 20;

    address private operator;

    /// @dev event for set start date
    /// @param date The date of the start date
    event StartDateSet(uint256 date);

    /// @dev event when beneficiary claim tokens
    /// @param beneficiary a beneficiary address
    /// @param amount a claimed amount
    event Claimed(address indexed beneficiary, uint256 amount);

    /// @dev event when beneficiary's vesting detail been set
    /// @param beneficiary a beneficiary address
    /// @param amount a claimed amount
    event Vested(address indexed beneficiary, uint256 amount);

    modifier onlyOperator() {
        require(
            msg.sender == operator,
            "onlyOperator: caller is not the operator"
        );
        _;
    }

    constructor(address _token, uint256 _startDate) {
        require(
            _startDate >= block.timestamp,
            "Start date cannot be before the deployment date"
        );
        require(_token != address(0), "Address cannot be zero");
        startDate = _startDate;
        token = _token;
        operator = msg.sender;

        //emit event
        emit StartDateSet(_startDate);
    }

    mapping(address => VestingDetail) internal vestingDetails;

    /**
     * @dev Allow owner set user's vesting struct
     * @param _vestingDetails A list of beneficiary's vesting.
     */

    function setVesting(VestingDetail[] calldata _vestingDetails)
        override
        external
        onlyOperator
    {
        uint256 count = _vestingDetails.length;
        // At least one vesting detail is required.
        require(count > 0, "No vesting list provided");
        // Check on the maximum size over which the for loop will run over.
        require(count <= maxVestingDetailArray, "Too many vesting details");

        for (uint256 i = 0; i < count; i++) {
            address beneficiary = _vestingDetails[i].beneficiary;
            require(
                beneficiary != owner() &&
                    beneficiary != address(0) &&
                    beneficiary != operator,
                "Beneficiary address is not valid"
            );
            //Check if beneficiary already has a vesting
            require(
                vestingDetails[beneficiary].vestingAmount == 0,
                "Vesting already exists"
            );
            //Beneficiary's vesting amount must be greater than 0
            require(
                _vestingDetails[i].vestingAmount > 0,
                "Vesting amount is not valid"
            );
            //Vesting duration must be greater than 0
            require(_vestingDetails[i].duration > 0, "Duration is not valid");
            //New beneficiary's initial claimed amount must be 0
            require(
                _vestingDetails[i].claimedAmount == 0,
                "Claimed amount is not valid"
            );
            //New beneficiary's last claimed time must be 0,indicating that they have never claimed
            require(
                _vestingDetails[i].lastClaimedTime == 0,
                "Last claimed time is not valid"
            );
            if (_vestingDetails[i].initialAmount > 0) {
                //New beneficiary's initial claimed must be false
                require(
                    _vestingDetails[i].initialClaimed == false,
                    "Initial claimed is not valid"
                );
            } else {
                //New beneficiary's initial claimed must be true if there is no initialAmount
                require(
                    _vestingDetails[i].initialClaimed == true,
                    "Initial claimed is not valid"
            );
            }
            //New beneficiary's claim start time must be not be before start date
            require(
                _vestingDetails[i].claimStartTime >= startDate,
                "Claim start time is not valid"
            );

            vestingDetails[beneficiary] = VestingDetail(
                beneficiary,
                _vestingDetails[i].vestingAmount,
                _vestingDetails[i].duration,
                _vestingDetails[i].claimedAmount,
                _vestingDetails[i].lastClaimedTime,
                _vestingDetails[i].initialAmount,
                _vestingDetails[i].initialClaimed,
                _vestingDetails[i].claimStartTime
            );

            totalVestingAmount += _vestingDetails[i].vestingAmount;

            emit Vested(beneficiary, _vestingDetails[i].vestingAmount);
        }
    }

    /**
     * @dev Allow user to claim token from vesting after start date.
     */
    function claim() override external {
        //Start date must be must be in the past but not 0
        require(
            startDate > 0 && block.timestamp >= startDate,
            "Claim is not allowed before start"
        );

        address beneficiary = msg.sender;
        require(
            block.timestamp >= vestingDetails[beneficiary].claimStartTime,
            "Claim is not allowed before claim start date"
        );
        //Beneficiary must have a vesting amount
        require(
            vestingDetails[beneficiary].vestingAmount > 0,
            "Vesting does not exist"
        );
        //Beneficiary must have not claimed all of their vesting amount
        require(
            vestingDetails[beneficiary].claimedAmount <
                vestingDetails[beneficiary].vestingAmount,
            "You have already claimed your vested amount"
        );

        uint256 amountToClaim;

        // if initial claim is not done, claim initial amount + linear amount
        if (
            !vestingDetails[beneficiary].initialClaimed &&
            vestingDetails[beneficiary].initialAmount > 0
        ) {
            amountToClaim += vestingDetails[beneficiary].initialAmount;
            vestingDetails[beneficiary].initialClaimed = true;
        }

        // Check that block is after the cliff period.
        if (block.timestamp >= vestingDetails[beneficiary].claimStartTime) {
            uint256 lastClaimedTime = vestingDetails[beneficiary]
                .lastClaimedTime;
            if (lastClaimedTime == 0)
                lastClaimedTime = vestingDetails[beneficiary].claimStartTime;

            amountToClaim +=
                ((block.timestamp - lastClaimedTime) *
                    (vestingDetails[beneficiary].vestingAmount -
                        vestingDetails[beneficiary].initialAmount)) /
                vestingDetails[beneficiary].duration;

            // In case the last claim amount is greater than the remaining amount
            if (
                amountToClaim >
                vestingDetails[beneficiary].vestingAmount -
                    vestingDetails[beneficiary].claimedAmount
            )
                amountToClaim =
                    vestingDetails[beneficiary].vestingAmount -
                    vestingDetails[beneficiary].claimedAmount;
        }

        vestingDetails[beneficiary].lastClaimedTime = block.timestamp;
        vestingDetails[beneficiary].claimedAmount += amountToClaim;
        totalClaimed += amountToClaim;
        ERC20(token).safeTransfer(beneficiary, amountToClaim);

        emit Claimed(beneficiary, amountToClaim);
    }

    /**
     * @dev Get beneficiary's vesting detail
     */
    function getOperator()
        external
        view
        returns (address)
    {
        return operator;
    }

    /**
     * @dev Get beneficiary's vesting detail
     */
    function getBeneficiaryVesting(address _beneficiary)
        external
        view
        returns (VestingDetail memory)
    {
        return vestingDetails[_beneficiary];
    }

    /**
     * @dev Allow owner to set operator
     * @param _operator Operator address
     */
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Address cannot be zero");
        require(_operator != msg.sender, "Cannot set self as operator");
        require(_operator != operator, "Already set");
        operator = _operator;
    }

    /**
     * @dev Allow owner to set start date
     * @param _date  The date of the start
     */
    function setStartDate(uint256 _date) external onlyOwner {
        require(_date > block.timestamp, "Start date is not valid");
        require(startDate != _date, "Start date is already set");
        startDate = _date;
        emit StartDateSet(_date);
    }
}
