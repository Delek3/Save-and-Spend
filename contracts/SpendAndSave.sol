// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract SpendAndSave {
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant SAVINGS_BASIS_POINTS = 2_000;

    address public owner;
    address public savingsVault;

    mapping(address stablecoin => bool supported) public supportedStablecoin;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SavingsVaultUpdated(address indexed previousVault, address indexed newVault);
    event StablecoinSupportUpdated(address indexed stablecoin, bool supported);
    event SpendAndSaveExecuted(
        address indexed user,
        address indexed stablecoin,
        address indexed recipient,
        address savingsVault,
        uint256 spendAmount,
        uint256 savingsAmount,
        uint256 totalAmount
    );

    error InvalidAddress();
    error NotOwner();
    error TransferFailed();
    error UnsupportedStablecoin();
    error ZeroAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialSavingsVault, address[] memory initialStablecoins) {
        if (initialSavingsVault == address(0)) revert InvalidAddress();

        owner = msg.sender;
        savingsVault = initialSavingsVault;

        emit OwnershipTransferred(address(0), msg.sender);
        emit SavingsVaultUpdated(address(0), initialSavingsVault);

        for (uint256 i = 0; i < initialStablecoins.length; i++) {
            _setStablecoin(initialStablecoins[i], true);
        }
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();

        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function setSavingsVault(address newSavingsVault) external onlyOwner {
        if (newSavingsVault == address(0)) revert InvalidAddress();

        address previousVault = savingsVault;
        savingsVault = newSavingsVault;
        emit SavingsVaultUpdated(previousVault, newSavingsVault);
    }

    function setStablecoin(address stablecoin, bool supported) external onlyOwner {
        _setStablecoin(stablecoin, supported);
    }

    function previewSavings(uint256 spendAmount) public pure returns (uint256 savingsAmount, uint256 totalAmount) {
        savingsAmount = (spendAmount * SAVINGS_BASIS_POINTS) / BASIS_POINTS;
        totalAmount = spendAmount + savingsAmount;
    }

    function spend(address stablecoin, address recipient, uint256 spendAmount)
        external
        returns (uint256 savingsAmount, uint256 totalAmount)
    {
        return spendToVault(stablecoin, recipient, spendAmount, savingsVault);
    }

    function spendToVault(address stablecoin, address recipient, uint256 spendAmount, address targetSavingsVault)
        public
        returns (uint256 savingsAmount, uint256 totalAmount)
    {
        if (!supportedStablecoin[stablecoin]) revert UnsupportedStablecoin();
        if (recipient == address(0) || targetSavingsVault == address(0)) revert InvalidAddress();
        if (spendAmount == 0) revert ZeroAmount();

        (savingsAmount, totalAmount) = previewSavings(spendAmount);

        _safeTransferFrom(stablecoin, msg.sender, recipient, spendAmount);
        _safeTransferFrom(stablecoin, msg.sender, targetSavingsVault, savingsAmount);

        emit SpendAndSaveExecuted(
            msg.sender,
            stablecoin,
            recipient,
            targetSavingsVault,
            spendAmount,
            savingsAmount,
            totalAmount
        );
    }

    function _setStablecoin(address stablecoin, bool supported) internal {
        if (stablecoin == address(0)) revert InvalidAddress();

        supportedStablecoin[stablecoin] = supported;
        emit StablecoinSupportUpdated(stablecoin, supported);
    }

    function _safeTransferFrom(address stablecoin, address from, address to, uint256 value) internal {
        (bool success, bytes memory returnData) =
            stablecoin.call(abi.encodeCall(IERC20.transferFrom, (from, to, value)));

        if (!success || (returnData.length != 0 && !abi.decode(returnData, (bool)))) {
            revert TransferFailed();
        }
    }
}
