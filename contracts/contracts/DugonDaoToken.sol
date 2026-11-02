// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title DUGON DAO ($DUGON)
/// @notice Fixed-supply governance token for the DUGON TCG demo. TESTNET ONLY (Base Sepolia).
/// @dev The whole supply (598,000,000 DUGON) is minted once in the constructor and split
///      across allocation buckets by basis points. There is no owner, no mint function and no
///      pause: after deployment nobody can create new tokens or freeze transfers.
///      ERC20Votes is included so holders can delegate and vote with an OpenZeppelin Governor later.
contract DugonDaoToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes {
    /// @notice 598,000,000 tokens with 18 decimals.
    uint256 public constant TOTAL_SUPPLY = 598_000_000 ether;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    struct Allocation {
        string label;
        address recipient;
        uint16 bps;
        uint256 amount;
    }

    Allocation[] private _allocations;

    event AllocationMinted(string label, address indexed recipient, uint16 bps, uint256 amount);

    error LengthMismatch();
    error NoAllocations();
    error ZeroRecipient(uint256 index);
    error ZeroShare(uint256 index);
    error SharesMustTotal100Percent(uint256 totalBps);

    /// @param labels     Human-readable bucket names, e.g. "initial", "dev", "marketing".
    /// @param recipients Wallet that receives each bucket.
    /// @param bps        Share of TOTAL_SUPPLY per bucket in basis points (100 bps = 1%). Must sum to 10,000.
    constructor(string[] memory labels, address[] memory recipients, uint16[] memory bps)
        ERC20("DUGON DAO", "DUGON")
        ERC20Permit("DUGON DAO")
    {
        uint256 n = recipients.length;
        if (n == 0) revert NoAllocations();
        if (labels.length != n || bps.length != n) revert LengthMismatch();

        uint256 totalBps;
        for (uint256 i = 0; i < n; i++) {
            if (recipients[i] == address(0)) revert ZeroRecipient(i);
            if (bps[i] == 0) revert ZeroShare(i);
            totalBps += bps[i];
        }
        if (totalBps != BPS_DENOMINATOR) revert SharesMustTotal100Percent(totalBps);

        uint256 minted;
        for (uint256 i = 0; i < n; i++) {
            // The last bucket takes any rounding dust so the total is exactly TOTAL_SUPPLY.
            uint256 amount = i == n - 1 ? TOTAL_SUPPLY - minted : (TOTAL_SUPPLY * bps[i]) / BPS_DENOMINATOR;
            minted += amount;
            _allocations.push(Allocation(labels[i], recipients[i], bps[i], amount));
            _mint(recipients[i], amount);
            emit AllocationMinted(labels[i], recipients[i], bps[i], amount);
        }
    }

    /// @notice Number of allocation buckets set at deployment.
    function allocationCount() external view returns (uint256) {
        return _allocations.length;
    }

    /// @notice Allocation bucket `i` as set at deployment.
    function allocation(uint256 i) external view returns (Allocation memory) {
        return _allocations[i];
    }

    // --- Required overrides ---

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
