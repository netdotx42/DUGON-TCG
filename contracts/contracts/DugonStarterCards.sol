// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title DUGON TCG starter cards (TESTNET DEMO)
 * @notice Minimal ERC-1155 for Base Sepolia. Each address may claim the free 5-card
 *         starter pack exactly once. No payments, no transfers restrictions, no token economy.
 * @dev Token ids 1..10 match the card ids in the game (lib/cards.ts). Starter pack = ids 1..5.
 */
contract DugonStarterCards is ERC1155, Ownable {
    uint256 public constant STARTER_FIRST_ID = 1;
    uint256 public constant STARTER_COUNT = 5;
    uint256 public constant MAX_CARD_ID = 10;

    mapping(address => bool) public hasClaimed;
    uint256 public totalClaims;

    event StarterClaimed(address indexed player, uint256[] ids);

    error AlreadyClaimed();
    error ContractCaller();

    constructor(string memory baseUri, address initialOwner) ERC1155(baseUri) Ownable(initialOwner) {}

    /// @notice Mint one copy of each starter card (ids 1..5) to the caller. Free, once per address.
    function claimStarter() external {
        // Contracts could farm claims via CREATE2 throwaway deployers; keep the demo to EOAs.
        // (Note: EIP-7702 delegated EOAs still pass this check, which is acceptable for a testnet demo.)
        if (msg.sender != tx.origin) revert ContractCaller();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        // Effects before interaction: _mintBatch calls onERC1155BatchReceived only for contracts,
        // but state is updated first regardless (checks-effects-interactions).
        hasClaimed[msg.sender] = true;
        unchecked {
            ++totalClaims;
        }

        uint256[] memory ids = new uint256[](STARTER_COUNT);
        uint256[] memory amounts = new uint256[](STARTER_COUNT);
        for (uint256 i = 0; i < STARTER_COUNT; ++i) {
            ids[i] = STARTER_FIRST_ID + i;
            amounts[i] = 1;
        }
        _mintBatch(msg.sender, ids, amounts, "");
        emit StarterClaimed(msg.sender, ids);
    }

    /// @notice Per-token metadata: {baseUri}{id}.json
    function uri(uint256 id) public view override returns (string memory) {
        require(id >= 1 && id <= MAX_CARD_ID, "unknown card");
        return string.concat(super.uri(id), Strings.toString(id), ".json");
    }

    function setBaseURI(string calldata newUri) external onlyOwner {
        _setURI(newUri);
    }
}
