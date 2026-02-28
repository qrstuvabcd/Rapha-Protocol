// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MedicalRecordRegistry.sol";

/**
 * @title MedicalRecordRegistry Tests
 * @notice Foundry tests for the MedicalRecordRegistry contract
 */
contract MedicalRecordRegistryTest is Test {
    MedicalRecordRegistry public registry;

    address public patient = address(0x1);
    address public provider = address(0x2);
    address public doctor = address(0x3);
    address public unauthorized = address(0x4);

    string constant IPFS_HASH = "QmTest123456789";
    string constant INTEGRITY_HASH = "0x1234567890abcdef";
    string constant RECORD_TYPE = "MRI";
    bytes32 constant CONDITION_ID = bytes32(uint256(1));
    bytes32 constant NEW_CONDITION_ID = bytes32(uint256(2));

    event RecordRegistered(
        bytes32 indexed recordId,
        address indexed owner,
        address indexed provider,
        string ipfsHash,
        string recordType
    );

    event ConditionUpdated(
        bytes32 indexed recordId,
        bytes32 oldConditionId,
        bytes32 newConditionId
    );

    event RecordDeactivated(bytes32 indexed recordId);

    function setUp() public {
        registry = new MedicalRecordRegistry();
        
        // Fund test accounts
        vm.deal(patient, 10 ether);
        vm.deal(provider, 10 ether);
        vm.deal(doctor, 10 ether);
    }

    // ============ registerRecord Tests ============

    function test_RegisterRecord_Success() public {
        vm.prank(patient);
        
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        // Verify record was created
        assertNotEq(recordId, bytes32(0));
        
        IMedicalRecordRegistry.MedicalRecord memory record = registry.getRecord(recordId);
        assertEq(record.owner, patient);
        assertEq(record.ipfsHash, IPFS_HASH);
        assertEq(record.integrityHash, INTEGRITY_HASH);
        assertEq(record.recordType, RECORD_TYPE);
        assertEq(record.provider, provider);
        assertEq(record.conditionId, CONDITION_ID);
        assertTrue(record.isActive);
    }

    function test_RegisterRecord_EmitsEvent() public {
        vm.prank(patient);
        
        vm.expectEmit(false, true, true, true);
        emit RecordRegistered(
            bytes32(0), // We don't check the exact recordId
            patient,
            provider,
            IPFS_HASH,
            RECORD_TYPE
        );

        registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );
    }

    function test_RegisterRecord_RevertEmptyIpfsHash() public {
        vm.prank(patient);
        
        vm.expectRevert("IPFS hash required");
        registry.registerRecord(
            "",
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );
    }

    function test_RegisterRecord_RevertZeroProvider() public {
        vm.prank(patient);
        
        vm.expectRevert("Provider address required");
        registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            address(0),
            CONDITION_ID
        );
    }

    function test_RegisterRecord_UniqueRecordIds() public {
        vm.startPrank(patient);
        
        bytes32 recordId1 = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        bytes32 recordId2 = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            "Blood",
            provider,
            CONDITION_ID
        );

        vm.stopPrank();

        assertNotEq(recordId1, recordId2);
    }

    // ============ updateCondition Tests ============

    function test_UpdateCondition_Success() public {
        // Register a record
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        // Update condition
        vm.prank(patient);
        registry.updateCondition(recordId, NEW_CONDITION_ID);

        // Verify update
        IMedicalRecordRegistry.MedicalRecord memory record = registry.getRecord(recordId);
        assertEq(record.conditionId, NEW_CONDITION_ID);
    }

    function test_UpdateCondition_EmitsEvent() public {
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        vm.prank(patient);
        
        vm.expectEmit(true, false, false, true);
        emit ConditionUpdated(recordId, CONDITION_ID, NEW_CONDITION_ID);
        
        registry.updateCondition(recordId, NEW_CONDITION_ID);
    }

    function test_UpdateCondition_RevertNotOwner() public {
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        vm.prank(unauthorized);
        vm.expectRevert("Not record owner");
        registry.updateCondition(recordId, NEW_CONDITION_ID);
    }

    function test_UpdateCondition_RevertNonexistent() public {
        bytes32 fakeRecordId = bytes32(uint256(999));

        vm.prank(patient);
        vm.expectRevert("Record does not exist");
        registry.updateCondition(fakeRecordId, NEW_CONDITION_ID);
    }

    // ============ deactivateRecord Tests ============

    function test_DeactivateRecord_Success() public {
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        vm.prank(patient);
        registry.deactivateRecord(recordId);

        IMedicalRecordRegistry.MedicalRecord memory record = registry.getRecord(recordId);
        assertFalse(record.isActive);
    }

    function test_DeactivateRecord_EmitsEvent() public {
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        vm.prank(patient);
        
        vm.expectEmit(true, false, false, false);
        emit RecordDeactivated(recordId);
        
        registry.deactivateRecord(recordId);
    }

    function test_DeactivateRecord_RevertAlreadyDeactivated() public {
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        vm.prank(patient);
        registry.deactivateRecord(recordId);

        vm.prank(patient);
        vm.expectRevert("Record is deactivated");
        registry.deactivateRecord(recordId);
    }

    // ============ View Function Tests ============

    function test_GetPatientRecords() public {
        vm.startPrank(patient);
        
        bytes32 recordId1 = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            "MRI",
            provider,
            CONDITION_ID
        );

        bytes32 recordId2 = registry.registerRecord(
            "QmOther",
            INTEGRITY_HASH,
            "Blood",
            provider,
            CONDITION_ID
        );

        vm.stopPrank();

        bytes32[] memory records = registry.getPatientRecords(patient);
        assertEq(records.length, 2);
        assertEq(records[0], recordId1);
        assertEq(records[1], recordId2);
    }

    function test_GetRecordsByType() public {
        vm.startPrank(patient);
        
        registry.registerRecord(IPFS_HASH, INTEGRITY_HASH, "MRI", provider, CONDITION_ID);
        registry.registerRecord("Qm2", INTEGRITY_HASH, "Blood", provider, CONDITION_ID);
        registry.registerRecord("Qm3", INTEGRITY_HASH, "MRI", provider, CONDITION_ID);

        vm.stopPrank();

        bytes32[] memory mriRecords = registry.getRecordsByType(patient, "MRI");
        assertEq(mriRecords.length, 2);

        bytes32[] memory bloodRecords = registry.getRecordsByType(patient, "Blood");
        assertEq(bloodRecords.length, 1);
    }

    function test_GetProviderRecords() public {
        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            IPFS_HASH,
            INTEGRITY_HASH,
            RECORD_TYPE,
            provider,
            CONDITION_ID
        );

        bytes32[] memory records = registry.getProviderRecords(provider);
        assertEq(records.length, 1);
        assertEq(records[0], recordId);
    }

    // ============ Edge Cases ============

    function testFuzz_RegisterRecord(
        string calldata ipfsHash,
        string calldata recordType
    ) public {
        vm.assume(bytes(ipfsHash).length > 0);
        vm.assume(bytes(recordType).length > 0);

        vm.prank(patient);
        bytes32 recordId = registry.registerRecord(
            ipfsHash,
            INTEGRITY_HASH,
            recordType,
            provider,
            CONDITION_ID
        );

        assertTrue(registry.recordExistsCheck(recordId));
    }
}
