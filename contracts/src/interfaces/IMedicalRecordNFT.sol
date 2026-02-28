// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMedicalRecordNFT
 * @notice Interface for the Medical Record NFT contract
 */
interface IMedicalRecordNFT {
    // ============ Structs ============
    struct RecordMetadata {
        string recordType;
        string ipfsHash;
        address uploadedBy;
        uint256 uploadedAt;
        bool isActive;
    }

    // ============ Events ============
    event RecordMinted(
        uint256 indexed tokenId,
        address indexed patient,
        address indexed provider,
        string recordType,
        string ipfsHash
    );
    
    event AccessGranted(
        uint256 indexed tokenId,
        address indexed patient,
        address indexed provider
    );
    
    event AccessRevoked(
        uint256 indexed tokenId,
        address indexed patient,
        address indexed provider
    );
    
    event ProviderVerified(address indexed provider, bool verified);
    event RecordDeactivated(uint256 indexed tokenId);

    // ============ Minting ============
    function mintRecord(
        address patient,
        string memory recordType,
        string memory ipfsHash
    ) external returns (uint256);

    function mintOwnRecord(
        string memory recordType,
        string memory ipfsHash
    ) external returns (uint256);

    // ============ Access Control ============
    function grantAccess(uint256 tokenId, address provider) external;
    function revokeAccess(uint256 tokenId, address provider) external;
    function hasAccess(uint256 tokenId, address provider) external view returns (bool);
    function batchGrantAccess(uint256[] calldata tokenIds, address provider) external;

    // ============ Provider Management ============
    function setProviderVerified(address provider, bool verified) external;
    function verifiedProviders(address provider) external view returns (bool);

    // ============ Record Management ============
    function deactivateRecord(uint256 tokenId) external;

    // ============ View Functions ============
    function getPatientRecords(address patient) external view returns (uint256[] memory);
    function getRecordMetadata(uint256 tokenId) external view returns (
        string memory recordType,
        string memory ipfsHash,
        address uploadedBy,
        uint256 uploadedAt,
        bool isActive
    );
    function totalRecords() external view returns (uint256);
    function records(uint256 tokenId) external view returns (RecordMetadata memory);
    function providerAccess(uint256 tokenId, address provider) external view returns (bool);
}
