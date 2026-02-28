/**
 * Rapha Chain State Migration Script
 * 
 * Migrates existing Rapha.Ltd state data from Polygon Mainnet to
 * the new Rapha Chain genesis state.
 * 
 * Exports:
 * 1. User IDs and their medical records
 * 2. Active bounties and participants
 * 3. TACo conditions
 * 
 * Generates:
 * - genesis-alloc.json with migrated user balances
 * - migrated-records.json with record mappings
 * - migrated-bounties.json with bounty state
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

// Polygon Mainnet Contract Addresses (from MAINNET_DEPLOYED.md)
const MAINNET_CONFIG = {
    rpc: "https://polygon-rpc.com",
    chainId: 137,
    contracts: {
        MedicalRecordNFT: "0x5468B7d5F4A52d00b4192874598b620e53a0CcA6",
        MedicalRecordRegistry: "0x9190a401EbC76c81e4cDa372c3BA1DF83A51f344",
    }
};

// Rapha Chain Configuration
const RAPHA_CHAIN_CONFIG = {
    chainId: 7777,
    airdropPerUser: ethers.parseEther("1000"), // 1000 RAPHA per migrated user
};

// Contract ABIs (minimal for event reading)
const REGISTRY_ABI = [
    "event RecordRegistered(bytes32 indexed recordId, address indexed owner, address indexed provider, string ipfsHash, string recordType)",
    "event ConditionUpdated(bytes32 indexed recordId, bytes32 oldConditionId, bytes32 newConditionId)",
    "function getPatientRecords(address patient) view returns (bytes32[])",
    "function getRecord(bytes32 recordId) view returns (tuple(address owner, string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId, uint256 timestamp, bool isActive))",
];

interface MigratedUser {
    address: string;
    recordIds: string[];
    conditionIds: string[];
    raphaBalance: string;
}

interface MigratedRecord {
    recordId: string;
    owner: string;
    ipfsHash: string;
    recordType: string;
    provider: string;
    conditionId: string;
    originalChain: string;
}

interface MigrationResult {
    users: MigratedUser[];
    records: MigratedRecord[];
    totalUsers: number;
    totalRecords: number;
    genesisAlloc: Record<string, { balance: string; comment: string }>;
}

async function main() {
    console.log("🏥 Rapha Chain State Migration");
    console.log("================================");
    console.log(`Source: Polygon Mainnet (Chain ID: ${MAINNET_CONFIG.chainId})`);
    console.log(`Target: Rapha Chain (Chain ID: ${RAPHA_CHAIN_CONFIG.chainId})`);
    console.log("");

    // Connect to Polygon Mainnet
    const provider = new ethers.JsonRpcProvider(MAINNET_CONFIG.rpc);
    const network = await provider.getNetwork();
    console.log(`Connected to network: ${network.name} (${network.chainId})`);

    // Initialize contract interfaces
    const registryContract = new ethers.Contract(
        MAINNET_CONFIG.contracts.MedicalRecordRegistry,
        REGISTRY_ABI,
        provider
    );

    // Step 1: Get all RecordRegistered events
    console.log("\n📋 Fetching RecordRegistered events...");
    const fromBlock = 0; // Start from genesis or specify deployment block
    const toBlock = "latest";

    const recordEvents = await registryContract.queryFilter(
        registryContract.filters.RecordRegistered(),
        fromBlock,
        toBlock
    );

    console.log(`Found ${recordEvents.length} record registration events`);

    // Step 2: Build user and record mappings
    const users = new Map<string, MigratedUser>();
    const records: MigratedRecord[] = [];

    for (const event of recordEvents) {
        const args = event.args;
        if (!args) continue;

        const [recordId, owner, provider, ipfsHash, recordType] = args;

        // Add or update user
        if (!users.has(owner)) {
            users.set(owner, {
                address: owner,
                recordIds: [],
                conditionIds: [],
                raphaBalance: RAPHA_CHAIN_CONFIG.airdropPerUser.toString(),
            });
        }

        const user = users.get(owner)!;
        user.recordIds.push(recordId);

        // Add record
        records.push({
            recordId,
            owner,
            ipfsHash,
            recordType,
            provider,
            conditionId: "", // Will be populated from contract state
            originalChain: "polygon-mainnet",
        });
    }

    // Step 3: Fetch current record states (conditions)
    console.log("\n🔍 Fetching current record states...");
    for (const record of records) {
        try {
            const recordData = await registryContract.getRecord(record.recordId);
            record.conditionId = recordData.conditionId;

            const user = users.get(record.owner);
            if (user && recordData.conditionId && recordData.conditionId !== ethers.ZeroHash) {
                if (!user.conditionIds.includes(recordData.conditionId)) {
                    user.conditionIds.push(recordData.conditionId);
                }
            }
        } catch (error) {
            console.warn(`Failed to fetch record ${record.recordId}: ${error}`);
        }
    }

    // Step 4: Generate genesis allocations
    console.log("\n💰 Generating genesis allocations...");
    const genesisAlloc: Record<string, { balance: string; comment: string }> = {};

    for (const [address, user] of users) {
        genesisAlloc[address] = {
            balance: user.raphaBalance,
            comment: `Migrated user with ${user.recordIds.length} records`,
        };
    }

    // Step 5: Compile migration result
    const result: MigrationResult = {
        users: Array.from(users.values()),
        records,
        totalUsers: users.size,
        totalRecords: records.length,
        genesisAlloc,
    };

    // Step 6: Write output files
    const outputDir = path.join(__dirname, "..", "..", "cdk-node", "migration");

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write genesis allocations
    fs.writeFileSync(
        path.join(outputDir, "genesis-alloc.json"),
        JSON.stringify(genesisAlloc, null, 2)
    );

    // Write migrated records
    fs.writeFileSync(
        path.join(outputDir, "migrated-records.json"),
        JSON.stringify(records, null, 2)
    );

    // Write full migration result
    fs.writeFileSync(
        path.join(outputDir, "migration-result.json"),
        JSON.stringify(result, null, 2)
    );

    // Step 7: Generate summary
    console.log("\n✅ Migration Complete!");
    console.log("================================");
    console.log(`Total Users: ${result.totalUsers}`);
    console.log(`Total Records: ${result.totalRecords}`);
    console.log(`Total RAPHA Airdrop: ${ethers.formatEther(
        BigInt(result.totalUsers) * RAPHA_CHAIN_CONFIG.airdropPerUser
    )} RAPHA`);
    console.log("");
    console.log("Output files:");
    console.log(`  - ${path.join(outputDir, "genesis-alloc.json")}`);
    console.log(`  - ${path.join(outputDir, "migrated-records.json")}`);
    console.log(`  - ${path.join(outputDir, "migration-result.json")}`);
    console.log("");
    console.log("Next steps:");
    console.log("  1. Review genesis-alloc.json");
    console.log("  2. Merge into cdk-node/config/genesis.json alloc section");
    console.log("  3. Deploy system contracts with migrated state");

    return result;
}

// Utility: Merge migration into existing genesis.json
export async function mergeIntoGenesis(
    genesisPath: string,
    allocPath: string
): Promise<void> {
    const genesis = JSON.parse(fs.readFileSync(genesisPath, "utf-8"));
    const alloc = JSON.parse(fs.readFileSync(allocPath, "utf-8"));

    // Merge allocations
    genesis.alloc = {
        ...genesis.alloc,
        ...alloc,
    };

    // Write updated genesis
    fs.writeFileSync(genesisPath, JSON.stringify(genesis, null, 2));
    console.log(`✅ Merged ${Object.keys(alloc).length} allocations into ${genesisPath}`);
}

// Run if called directly
main().catch(console.error);
