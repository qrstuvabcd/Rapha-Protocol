// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RaphaToken
 * @author Rapha Protocol
 * @notice RAPHA governance and utility token (ERC-20).
 * @dev 18 decimals. Public mint is testnet-only and hard-disabled on production chains.
 */
contract RaphaToken is ERC20 {
    address public immutable deployer;

    error FaucetDisabledOnProductionChain(uint256 chainId);

    constructor() ERC20("Rapha Protocol", "RAPHA") {
        deployer = msg.sender;
        _mint(msg.sender, 1_000_000_000 * 10 ** 18);
    }

    /// @notice Testnet faucet; disabled on Ethereum mainnet and Polygon mainnet.
    function mint(address to, uint256 amount) external {
        if (block.chainid == 1 || block.chainid == 137) {
            revert FaucetDisabledOnProductionChain(block.chainid);
        }
        _mint(to, amount);
    }
}
