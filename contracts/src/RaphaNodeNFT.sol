// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title RaphaNodeNFT
 * @notice Registry NFT for yield rights attached to one physical Rapha Edge node.
 * @dev The NFT owner receives the miner/investor share from RaphaClearingVault.
 *      The hardware hash is immutable after mint because it is bound to the
 *      appliance TPM/SGX identity. Operational fields can be updated by the
 *      protocol owner when a hospital treasury or local onboarder changes.
 */
contract RaphaNodeNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    mapping(uint256 => bytes32) public nodeHardwareHash;
    mapping(uint256 => address) public hospitalTreasury;
    mapping(uint256 => address) public nodeOnboarder;
    mapping(uint256 => bool) public isNodeActive;
    mapping(bytes32 => uint256) public tokenIdByHardwareHash;

    event NodeMinted(
        uint256 indexed tokenId,
        address indexed investor,
        bytes32 indexed hardwareHash,
        address hospitalTreasury,
        address onboarder,
        string tokenURI
    );
    event NodeActiveStatusUpdated(uint256 indexed tokenId, bool active);
    event NodeHospitalTreasuryUpdated(uint256 indexed tokenId, address indexed oldTreasury, address indexed newTreasury);
    event NodeOnboarderUpdated(uint256 indexed tokenId, address indexed oldOnboarder, address indexed newOnboarder);

    error ZeroAddress();
    error ZeroHardwareHash();
    error HardwareHashAlreadyRegistered();
    error UnknownNode();

    constructor() ERC721("Rapha Protocol Edge Node", "RAPHA-NODE") Ownable(msg.sender) {}

    function mintNode(
        address investor,
        bytes32 hardwareHash,
        address treasury,
        address onboarder,
        string calldata metadataURI
    ) external onlyOwner returns (uint256 tokenId) {
        _requireNonZero(investor);
        _requireNonZero(treasury);
        _requireNonZero(onboarder);
        if (hardwareHash == bytes32(0)) revert ZeroHardwareHash();
        if (tokenIdByHardwareHash[hardwareHash] != 0) revert HardwareHashAlreadyRegistered();

        tokenId = _nextTokenId++;
        nodeHardwareHash[tokenId] = hardwareHash;
        hospitalTreasury[tokenId] = treasury;
        nodeOnboarder[tokenId] = onboarder;
        isNodeActive[tokenId] = true;
        tokenIdByHardwareHash[hardwareHash] = tokenId;

        _safeMint(investor, tokenId);
        if (bytes(metadataURI).length != 0) {
            _setTokenURI(tokenId, metadataURI);
        }

        emit NodeMinted(tokenId, investor, hardwareHash, treasury, onboarder, metadataURI);
    }

    function setNodeActive(uint256 tokenId, bool active) external onlyOwner {
        _requireNode(tokenId);
        isNodeActive[tokenId] = active;
        emit NodeActiveStatusUpdated(tokenId, active);
    }

    function setHospitalTreasury(uint256 tokenId, address newTreasury) external onlyOwner {
        _requireNode(tokenId);
        _requireNonZero(newTreasury);
        address oldTreasury = hospitalTreasury[tokenId];
        hospitalTreasury[tokenId] = newTreasury;
        emit NodeHospitalTreasuryUpdated(tokenId, oldTreasury, newTreasury);
    }

    function setNodeOnboarder(uint256 tokenId, address newOnboarder) external onlyOwner {
        _requireNode(tokenId);
        _requireNonZero(newOnboarder);
        address oldOnboarder = nodeOnboarder[tokenId];
        nodeOnboarder[tokenId] = newOnboarder;
        emit NodeOnboarderUpdated(tokenId, oldOnboarder, newOnboarder);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _requireNode(uint256 tokenId) internal view {
        if (_ownerOf(tokenId) == address(0)) revert UnknownNode();
    }

    function _requireNonZero(address value) internal pure {
        if (value == address(0)) revert ZeroAddress();
    }
}
