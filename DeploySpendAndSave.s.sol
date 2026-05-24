// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/SpendAndSave.sol";

interface Vm {
    function envAddress(string calldata name) external view returns (address);
    function startBroadcast() external;
    function stopBroadcast() external;
}

contract DeploySpendAndSave {
    address internal constant USDC = 0x3600000000000000000000000000000000000000;
    address internal constant EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (SpendAndSave deployed) {
        address savingsVault = vm.envAddress("SAVINGS_VAULT");
        address[] memory stablecoins = new address[](2);
        stablecoins[0] = USDC;
        stablecoins[1] = EURC;

        vm.startBroadcast();
        deployed = new SpendAndSave(savingsVault, stablecoins);
        vm.stopBroadcast();
    }
}
