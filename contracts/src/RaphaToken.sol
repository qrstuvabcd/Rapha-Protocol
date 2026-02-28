// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RaphaToken
 * @author Rapha Protocol
 * @notice RAPHA governance and utility token (ERC-20).
 * @dev 18 decimals. Public mint for testnet usage.
 */
contract RaphaToken is ERC20 {
    address public immutable deployer;

    constructor() ERC20("Rapha Protocol", "RAPHA") {
        deployer = msg.sender;
        // Mint 1 billion RAPHA to deployer
        _mint(msg.sender, 1_000_000_000 * 10 ** 18);
    }

    /// @notice Testnet faucet — anyone can mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
