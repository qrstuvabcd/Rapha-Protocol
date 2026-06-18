// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MedicalRecordNFT
 * @author Rapha Protocol
 * @notice ERC-721 ownership shell for sealed medical-record access rights.
 * @dev The contract intentionally stores only a commitment. Do not put record
 *      type, provider identity, patient metadata, or IPFS CIDs on-chain.
 */
contract MedicalRecordNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    struct RecordMetadata {
        bytes32 metadataCommitment;
        address uploadedBy;
        uint256 uploadedAt;
        bool isActive;
    }

    mapping(uint256 => RecordMetadata) public records;
    mapping(uint256 => mapping(address => bool)) public providerAccess;
    mapping(address => bool) public verifiedProviders;
    mapping(address => uint256[]) public patientRecords;

    event RecordMinted(
        uint256 indexed tokenId,
        address indexed patient,
        address indexed provider,
        bytes32 metadataCommitment
    );
    event AccessGranted(uint256 indexed tokenId, address indexed patient, address indexed provider);
    event AccessRevoked(uint256 indexed tokenId, address indexed patient, address indexed provider);
    event ProviderVerified(address indexed provider, bool verified);
    event RecordDeactivated(uint256 indexed tokenId);

    constructor() ERC721("Rapha Protocol Medical Record", "RAPHA-MED") Ownable(msg.sender) {}

    function mintRecord(address patient, bytes32 metadataCommitment) external returns (uint256) {
        return _mintRecord(patient, metadataCommitment, msg.sender);
    }

    function mintOwnRecord(bytes32 metadataCommitment) external returns (uint256) {
        return _mintRecord(msg.sender, metadataCommitment, msg.sender);
    }

    function grantAccess(uint256 tokenId, address provider) external {
        require(ownerOf(tokenId) == msg.sender, "Not record owner");
        require(provider != address(0), "Invalid provider");

        providerAccess[tokenId][provider] = true;
        emit AccessGranted(tokenId, msg.sender, provider);
    }

    function revokeAccess(uint256 tokenId, address provider) external {
        require(ownerOf(tokenId) == msg.sender, "Not record owner");

        providerAccess[tokenId][provider] = false;
        emit AccessRevoked(tokenId, msg.sender, provider);
    }

    function hasAccess(uint256 tokenId, address provider) external view returns (bool) {
        if (ownerOf(tokenId) == provider) return true;
        return providerAccess[tokenId][provider];
    }

    function batchGrantAccess(uint256[] calldata tokenIds, address provider) external {
        require(provider != address(0), "Invalid provider");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not record owner");
            providerAccess[tokenIds[i]][provider] = true;
            emit AccessGranted(tokenIds[i], msg.sender, provider);
        }
    }

    function setProviderVerified(address provider, bool verified) external onlyOwner {
        verifiedProviders[provider] = verified;
        emit ProviderVerified(provider, verified);
    }

    function deactivateRecord(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not record owner");
        records[tokenId].isActive = false;
        emit RecordDeactivated(tokenId);
    }

    function getPatientRecords(address patient) external view returns (uint256[] memory) {
        return patientRecords[patient];
    }

    function getRecordMetadata(uint256 tokenId) external view returns (
        bytes32 metadataCommitment,
        address uploadedBy,
        uint256 uploadedAt,
        bool isActive
    ) {
        RecordMetadata memory record = records[tokenId];
        return (record.metadataCommitment, record.uploadedBy, record.uploadedAt, record.isActive);
    }

    function totalRecords() external view returns (uint256) {
        return _nextTokenId;
    }

    function _mintRecord(
        address patient,
        bytes32 metadataCommitment,
        address uploader
    ) private returns (uint256) {
        require(patient != address(0), "Invalid patient address");
        require(metadataCommitment != bytes32(0), "Metadata commitment required");

        uint256 tokenId = _nextTokenId++;
        _safeMint(patient, tokenId);
        _setTokenURI(tokenId, "rapha://sealed-medical-record");

        records[tokenId] = RecordMetadata({
            metadataCommitment: metadataCommitment,
            uploadedBy: uploader,
            uploadedAt: block.timestamp,
            isActive: true
        });
        patientRecords[patient].push(tokenId);

        if (verifiedProviders[uploader]) {
            providerAccess[tokenId][uploader] = true;
        }

        emit RecordMinted(tokenId, patient, uploader, metadataCommitment);
        return tokenId;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
