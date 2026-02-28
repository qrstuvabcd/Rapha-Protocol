// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


/**
 * @title MedicalRecordNFT
 * @author RAPHA Protocol
 * @notice ERC-721 NFT representing encrypted medical records
 * @dev Each NFT represents a single medical record. The patient owns the NFT.
 *      Token URI points to IPFS hash of encrypted file + metadata.
 *      Access control is managed via provider approvals per token.
 */
contract MedicalRecordNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;

    // ============ Structs ============
    struct RecordMetadata {
        string recordType;        // "MRI", "Blood", "X-Ray", etc.
        string ipfsHash;          // IPFS hash of encrypted file
        address uploadedBy;       // Provider who uploaded
        uint256 uploadedAt;       // Timestamp
        bool isActive;            // Can be deactivated
    }

    // ============ Storage ============
    
    /// @notice Token ID => Record Metadata
    mapping(uint256 => RecordMetadata) public records;
    
    /// @notice Token ID => Provider Address => Access Granted
    mapping(uint256 => mapping(address => bool)) public providerAccess;
    
    /// @notice Provider Address => Is Verified Provider
    mapping(address => bool) public verifiedProviders;
    
    /// @notice Patient Address => Array of Token IDs
    mapping(address => uint256[]) public patientRecords;

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

    // ============ Constructor ============
    constructor() ERC721("RAPHA Medical Record", "RAPHA-MED") Ownable(msg.sender) {}

    // ============ Minting ============

    /**
     * @notice Mint a new medical record NFT
     * @param patient Address of the patient who will own the NFT
     * @param recordType Type of medical record (e.g., "MRI", "Blood")
     * @param ipfsHash IPFS hash of the encrypted file
     * @return tokenId The newly minted token ID
     */
    function mintRecord(
        address patient,
        string memory recordType,
        string memory ipfsHash
    ) external returns (uint256) {
        require(patient != address(0), "Invalid patient address");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        
        uint256 tokenId = _nextTokenId++;
        
        
        // Mint NFT to patient
        _safeMint(patient, tokenId);
        
        // Set token URI to IPFS
        string memory uri = string(abi.encodePacked("ipfs://", ipfsHash));
        _setTokenURI(tokenId, uri);
        
        // Store metadata
        records[tokenId] = RecordMetadata({
            recordType: recordType,
            ipfsHash: ipfsHash,
            uploadedBy: msg.sender,
            uploadedAt: block.timestamp,
            isActive: true
        });
        
        // Track patient's records
        patientRecords[patient].push(tokenId);
        
        // Auto-grant access to uploader if they're a verified provider
        if (verifiedProviders[msg.sender]) {
            providerAccess[tokenId][msg.sender] = true;
        }
        
        emit RecordMinted(tokenId, patient, msg.sender, recordType, ipfsHash);
        
        return tokenId;
    }

    /**
     * @notice Patient mints their own record
     * @param recordType Type of medical record
     * @param ipfsHash IPFS hash of the encrypted file
     * @return tokenId The newly minted token ID
     */
    function mintOwnRecord(
        string memory recordType,
        string memory ipfsHash
    ) external returns (uint256) {
        return this.mintRecord(msg.sender, recordType, ipfsHash);
    }

    // ============ Access Control ============

    /**
     * @notice Grant a provider access to view this record
     * @param tokenId The token ID of the record
     * @param provider Address of the provider to grant access
     */
    function grantAccess(uint256 tokenId, address provider) external {
        require(ownerOf(tokenId) == msg.sender, "Not record owner");
        require(provider != address(0), "Invalid provider");
        
        providerAccess[tokenId][provider] = true;
        
        emit AccessGranted(tokenId, msg.sender, provider);
    }

    /**
     * @notice Revoke a provider's access to this record
     * @param tokenId The token ID of the record
     * @param provider Address of the provider to revoke access
     */
    function revokeAccess(uint256 tokenId, address provider) external {
        require(ownerOf(tokenId) == msg.sender, "Not record owner");
        
        providerAccess[tokenId][provider] = false;
        
        emit AccessRevoked(tokenId, msg.sender, provider);
    }

    /**
     * @notice Check if a provider has access to a record
     * @param tokenId The token ID of the record
     * @param provider Address of the provider
     * @return hasAccess Whether the provider has access
     */
    function hasAccess(uint256 tokenId, address provider) external view returns (bool) {
        // Owner always has access
        if (ownerOf(tokenId) == provider) return true;
        
        // Check explicit access grant
        return providerAccess[tokenId][provider];
    }

    /**
     * @notice Grant access to multiple records at once
     * @param tokenIds Array of token IDs
     * @param provider Address of the provider
     */
    function batchGrantAccess(uint256[] calldata tokenIds, address provider) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not record owner");
            providerAccess[tokenIds[i]][provider] = true;
            emit AccessGranted(tokenIds[i], msg.sender, provider);
        }
    }

    // ============ Provider Management ============

    /**
     * @notice Verify a provider (admin only)
     * @param provider Address of the provider
     * @param verified Whether to verify or unverify
     */
    function setProviderVerified(address provider, bool verified) external onlyOwner {
        verifiedProviders[provider] = verified;
        emit ProviderVerified(provider, verified);
    }

    // ============ Record Management ============

    /**
     * @notice Deactivate a record (does not burn, just marks inactive)
     * @param tokenId The token ID of the record
     */
    function deactivateRecord(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not record owner");
        records[tokenId].isActive = false;
        emit RecordDeactivated(tokenId);
    }

    // ============ View Functions ============

    /**
     * @notice Get all record token IDs for a patient
     * @param patient Address of the patient
     * @return tokenIds Array of token IDs
     */
    function getPatientRecords(address patient) external view returns (uint256[] memory) {
        return patientRecords[patient];
    }

    /**
     * @notice Get record metadata
     * @param tokenId The token ID
     * @return recordType Type of record
     * @return ipfsHash IPFS hash
     * @return uploadedBy Provider address
     * @return uploadedAt Timestamp
     * @return isActive Active status
     */
    function getRecordMetadata(uint256 tokenId) external view returns (
        string memory recordType,
        string memory ipfsHash,
        address uploadedBy,
        uint256 uploadedAt,
        bool isActive
    ) {
        RecordMetadata memory record = records[tokenId];
        return (
            record.recordType,
            record.ipfsHash,
            record.uploadedBy,
            record.uploadedAt,
            record.isActive
        );
    }

    /**
     * @notice Get total number of records minted
     * @return count Total token count
     */
    function totalRecords() external view returns (uint256) {
        return _nextTokenId;
    }

    // ============ Required Overrides ============

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
