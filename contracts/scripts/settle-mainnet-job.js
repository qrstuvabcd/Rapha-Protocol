const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const POLYGON_CHAIN_ID = 137;
const DEPLOYMENT_PATH = path.join(__dirname, "..", "mainnet-clearing-vault-deployment.json");

function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

function optionalEnv(name) {
    const value = process.env[name];
    return value === undefined || value === "" ? undefined : value;
}

function requireBytes32(name) {
    const value = requireEnv(name);
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) throw new Error(`${name} must be 0x-prefixed bytes32 hex`);
    return value;
}

function loadDeployment() {
    if (!fs.existsSync(DEPLOYMENT_PATH)) {
        throw new Error(`Missing ${DEPLOYMENT_PATH}. Deploy or record the clearing-vault deployment first.`);
    }
    return JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));
}

function requirePositiveInt(name) {
    const value = Number.parseInt(requireEnv(name), 10);
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
    return value;
}

function readFileAsBase64(envName) {
    const filePath = requireEnv(envName);
    if (!fs.existsSync(filePath)) throw new Error(`${envName} points to a missing file: ${filePath}`);
    return fs.readFileSync(filePath).toString("base64");
}

function parseOptionalJsonEnv(name, fallback) {
    const value = optionalEnv(name);
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (error) {
        throw new Error(`${name} must be valid JSON`);
    }
}

async function validateProof(vault, proof, expected) {
    if (!hre.ethers.isHexString(proof)) throw new Error("PROOF_HEX must be 0x-prefixed ABI-encoded bytes");

    const decoded = hre.ethers.AbiCoder.defaultAbiCoder().decode(
        ["bytes32", "uint256", "address", "bytes32", "bytes"],
        proof,
    );
    const [proofJobId, proofNodeTokenId, proofAiCompanyWallet, proofPayloadHash, signature] = decoded;

    if (proofJobId.toLowerCase() !== expected.jobId.toLowerCase()) throw new Error("Proof JOB_ID does not match escrow");
    if (proofNodeTokenId !== BigInt(expected.nodeTokenId)) throw new Error("Proof NODE_TOKEN_ID does not match escrow");
    if (proofAiCompanyWallet.toLowerCase() !== expected.aiCompanyWallet.toLowerCase()) {
        throw new Error("Proof AI_COMPANY_WALLET does not match escrow");
    }
    if (proofPayloadHash.toLowerCase() !== expected.payloadHash.toLowerCase()) {
        throw new Error("Proof PAYLOAD_HASH does not match expected training payload");
    }

    const digest = await vault.proofDigestFor(
        expected.jobId,
        expected.nodeTokenId,
        expected.aiCompanyWallet,
        expected.payloadHash,
    );
    const trustedAttestor = await vault.trustedAttestor();
    const recovered = hre.ethers.verifyMessage(hre.ethers.getBytes(digest), signature);
    if (recovered.toLowerCase() !== trustedAttestor.toLowerCase()) {
        throw new Error(`Proof signer ${recovered} does not match vault trusted attestor ${trustedAttestor}`);
    }

    return { digest, trustedAttestor, recovered };
}

async function requestProductionAttestationProof(vault, jobId, nodeTokenId, aiCompanyWallet, payloadHash, escrowAmount) {
    const serviceUrl = optionalEnv("RAPHA_ATTESTATION_SERVICE_URL");
    if (!serviceUrl) return null;

    const nodeRegistryAddress = await vault.nodeRegistry();
    const nodeRegistry = await hre.ethers.getContractAt("RaphaNodeNFT", nodeRegistryAddress);
    const hardwareHash = await nodeRegistry.nodeHardwareHash(nodeTokenId);

    const body = {
        job_id: jobId,
        node_token_id: nodeTokenId,
        ai_company_wallet: aiCompanyWallet,
        escrow_amount: escrowAmount.toString(),
        hardware_hash: hardwareHash,
        payload_hash: payloadHash,
        reported_mrenclave: requireBytes32("REPORTED_MRENCLAVE"),
        reported_mrsigner: optionalEnv("REPORTED_MRSIGNER"),
        sgx_quote_b64: readFileAsBase64("SGX_QUOTE_PATH"),
        tpm_quote_b64: readFileAsBase64("TPM_QUOTE_PATH"),
        tpm_pcrs: parseOptionalJsonEnv("TPM_PCRS_JSON", undefined),
        metadata: {
            source: "contracts/scripts/settle-mainnet-job.js",
            requestedAt: new Date().toISOString(),
        },
    };

    const headers = { "content-type": "application/json" };
    const apiKey = optionalEnv("RAPHA_ATTESTATION_API_KEY");
    if (apiKey) headers["x-rapha-attestation-key"] = apiKey;

    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/attest`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(`Attestation verifier rejected evidence (${response.status}): ${text}`);
    }

    const result = JSON.parse(text);
    if (result.allowed !== true || !result.on_chain?.submit_proof_abi_hex) {
        throw new Error("Attestation verifier did not return a settlement proof");
    }
    return result.on_chain.submit_proof_abi_hex;
}

async function main() {
    if (process.env.CONFIRM_MAINNET_SETTLEMENT !== "YES") {
        throw new Error("Refusing to settle mainnet escrow. Set CONFIRM_MAINNET_SETTLEMENT=YES after verifying the SGX/TDX receipt.");
    }

    const network = await hre.ethers.provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        throw new Error(`Refusing to settle on chain ${network.chainId}; expected Polygon mainnet ${POLYGON_CHAIN_ID}`);
    }

    const deployment = loadDeployment();
    const clearingVaultAddress = hre.ethers.getAddress(optionalEnv("RAPHA_CLEARING_VAULT_ADDRESS") || deployment.clearingVault);
    const jobId = requireBytes32("JOB_ID");
    const nodeTokenId = requirePositiveInt("NODE_TOKEN_ID");
    const aiCompanyWallet = hre.ethers.getAddress(requireEnv("AI_COMPANY_WALLET"));
    const payloadHash = requireBytes32("PAYLOAD_HASH");

    const [submitter] = await hre.ethers.getSigners();
    const vault = await hre.ethers.getContractAt("RaphaClearingVault", clearingVaultAddress);
    const escrow = await vault.escrows(jobId);
    if (escrow.aiCompanyWallet === hre.ethers.ZeroAddress) throw new Error("Unknown JOB_ID in RaphaClearingVault");
    if (escrow.settled || escrow.refunded) throw new Error("Escrow is already closed");
    if (escrow.nodeTokenId !== BigInt(nodeTokenId)) throw new Error("NODE_TOKEN_ID does not match escrow");
    if (escrow.aiCompanyWallet.toLowerCase() !== aiCompanyWallet.toLowerCase()) {
        throw new Error("AI_COMPANY_WALLET does not match escrow");
    }

    let proof = optionalEnv("PROOF_HEX");
    if (!proof) {
        proof = await requestProductionAttestationProof(
            vault,
            jobId,
            nodeTokenId,
            aiCompanyWallet,
            payloadHash,
            escrow.escrowAmount,
        );
    }

    if (!proof && process.env.ALLOW_LOCAL_ATTESTOR_SIGNING === "YES") {
        const attestorPrivateKey = requireEnv("RAPHA_ATTESTOR_PRIVATE_KEY");
        const attestor = new hre.ethers.Wallet(attestorPrivateKey);
        const trustedAttestor = await vault.trustedAttestor();
        if (trustedAttestor.toLowerCase() !== attestor.address.toLowerCase()) {
            throw new Error(`RAPHA_ATTESTOR_PRIVATE_KEY signs as ${attestor.address}, but vault trusts ${trustedAttestor}`);
        }
        const digest = await vault.proofDigestFor(jobId, nodeTokenId, aiCompanyWallet, payloadHash);
        const signature = await attestor.signMessage(hre.ethers.getBytes(digest));
        proof = hre.ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "uint256", "address", "bytes32", "bytes"],
            [jobId, nodeTokenId, aiCompanyWallet, payloadHash, signature],
        );
    }

    if (!proof) {
        throw new Error(
            "Missing settlement proof. Provide PROOF_HEX from rapha-attestation-verifier, or set RAPHA_ATTESTATION_SERVICE_URL with SGX_QUOTE_PATH/TPM_QUOTE_PATH evidence. Refusing implicit local signing on mainnet.",
        );
    }

    const { digest, trustedAttestor, recovered } = await validateProof(vault, proof, {
        jobId,
        nodeTokenId,
        aiCompanyWallet,
        payloadHash,
    });

    console.log("==================================================");
    console.log("Rapha Protocol Mainnet Settlement");
    console.log("==================================================");
    console.log("Vault:", clearingVaultAddress);
    console.log("Submitter:", submitter.address);
    console.log("Job ID:", jobId);
    console.log("Node token ID:", nodeTokenId);
    console.log("AI company wallet:", aiCompanyWallet);
    console.log("Escrow amount:", escrow.escrowAmount.toString(), "USDC base units");
    console.log("Proof digest:", digest);
    console.log("Vault trusted attestor:", trustedAttestor);
    console.log("Recovered proof signer:", recovered);

    const tx = await vault.submitProofAndSettle(proof);
    const receipt = await tx.wait();

    const record = {
        network: "polygon",
        chainId: POLYGON_CHAIN_ID,
        clearingVault: clearingVaultAddress,
        jobId,
        nodeTokenId,
        aiCompanyWallet,
        escrowAmount: escrow.escrowAmount.toString(),
        payloadHash,
        proofDigest: digest,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        settledAt: new Date().toISOString(),
    };
    fs.writeFileSync(
        path.join(__dirname, "..", "mainnet-settlement-receipt.json"),
        JSON.stringify(record, null, 2),
    );

    console.log("==================================================");
    console.log("Settlement Complete");
    console.log("==================================================");
    console.log("PolygonScan tx:", `https://polygonscan.com/tx/${receipt.hash}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
