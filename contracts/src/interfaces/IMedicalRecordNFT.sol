// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMedicalRecordNFT
 * @notice Interface for sealed medical-record access NFTs.
 */
interface IMedicalRecordNFT {
    struct RecordMetadata {
        bytes32 metadataCommitment;
        address uploadedBy;
        uint256 uploadedAt;
        bool isActive;
    }

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

    function mintRecord(address patient, bytes32 metadataCommitment) external returns (uint256);
    function mintOwnRecord(bytes32 metadataCommitment) external returns (uint256);

    function grantAccess(uint256 tokenId, address provider) external;
    function revokeAccess(uint256 tokenId, address provider) external;
    function hasAccess(uint256 tokenId, address provider) external view returns (bool);
    function batchGrantAccess(uint256[] calldata tokenIds, address provider) external;

    function setProviderVerified(address provider, bool verified) external;
    function verifiedProviders(address provider) external view returns (bool);

    function deactivateRecord(uint256 tokenId) external;

    function getPatientRecords(address patient) external view returns (uint256[] memory);
    function getRecordMetadata(uint256 tokenId) external view returns (
        bytes32 metadataCommitment,
        address uploadedBy,
        uint256 uploadedAt,
        bool isActive
    );
    function totalRecords() external view returns (uint256);
    function records(uint256 tokenId) external view returns (RecordMetadata memory);
    function providerAccess(uint256 tokenId, address provider) external view returns (bool);
}
