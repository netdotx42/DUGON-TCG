// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @dev Test helper only: tries to claim through a contract (must be rejected).
interface IDugon {
    function claimStarter() external;
}

contract ClaimProxy {
    function claim(address dugon) external {
        IDugon(dugon).claimStarter();
    }
}
