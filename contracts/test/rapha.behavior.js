const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const CID = "QmYwAPJzv5CZsnAzt8auVZRnFz78h7tRPRxG9qPz9xjG7a";
const RESULT_CID = "bafybeigdyrzt5sfp7udm7hu76h7y55t3krjiiisnq3cmuee6f4q2v7xvji";
const INTEGRITY_HASH = "0x" + "11".repeat(32);
const RECORD_TYPE = "Blood";
const CONDITION_ID = "0x" + "22".repeat(32);
const PROVIDER_ID = "nhs.uk";

async function signProof(proofHash, providerId, oracle) {
  const digest = ethers.solidityPackedKeccak256(
    ["bytes32", "string"],
    [proofHash, providerId]
  );
  return oracle.signMessage(ethers.getBytes(digest));
}

async function latestPatientRecordId(registry, patientAddress) {
  const recordIds = await registry.getPatientRecords(patientAddress);
  return recordIds[recordIds.length - 1];
}

describe("MedicalRecordRegistry", function () {
  let deployer;
  let patient;
  let provider;
  let oracle;
  let badOracle;
  let keeper;
  let registry;

  beforeEach(async function () {
    [deployer, patient, provider, oracle, badOracle, keeper] = await ethers.getSigners();
    registry = await ethers.deployContract("MedicalRecordRegistry", [], deployer);
  });

  it("limits trusted oracle configuration to the deployer", async function () {
    await expect(
      registry.connect(patient).setTrustedOracle(oracle.address)
    ).to.be.revertedWith("Only deployer");

    await expect(
      registry.connect(deployer).setTrustedOracle(ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid oracle address");

    await registry.connect(deployer).setTrustedOracle(oracle.address);
    expect(await registry.trustedOracle()).to.equal(oracle.address);
  });

  it("rejects non-CID record pointers", async function () {
    await expect(
      registry.connect(patient).registerRecord(
        "https://example.com/raw-phi.json",
        INTEGRITY_HASH,
        RECORD_TYPE,
        provider.address,
        CONDITION_ID
      )
    ).to.be.revertedWith("Invalid CID format");
  });

  it("requires a configured trusted oracle for verified ZK-TLS submissions", async function () {
    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof:1"));
    const signature = await signProof(proofHash, PROVIDER_ID, oracle);

    await expect(
      registry.connect(patient).submitVerifiedData(
        CID,
        INTEGRITY_HASH,
        RECORD_TYPE,
        provider.address,
        CONDITION_ID,
        PROVIDER_ID,
        proofHash,
        signature
      )
    ).to.be.revertedWith("Oracle not configured");
  });

  it("accepts oracle-signed verified data and indexes it for keeper review", async function () {
    await registry.connect(deployer).setTrustedOracle(oracle.address);

    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof:verified"));
    const signature = await signProof(proofHash, PROVIDER_ID, oracle);

    await expect(
      registry.connect(patient).submitVerifiedData(
        CID,
        INTEGRITY_HASH,
        RECORD_TYPE,
        provider.address,
        CONDITION_ID,
        PROVIDER_ID,
        proofHash,
        signature
      )
    )
      .to.emit(registry, "VerifiedDataSubmitted")
      .withArgs(
        anyValue,
        patient.address,
        PROVIDER_ID,
        proofHash
      );

    const recordId = await latestPatientRecordId(registry, patient.address);
    const record = await registry.getRecord(recordId);
    expect(record.owner).to.equal(patient.address);
    expect(record.provider).to.equal(provider.address);
    expect(record.isOriginVerified).to.equal(true);
    expect(record.proofHash).to.equal(proofHash);
    expect(record.providerId).to.equal(PROVIDER_ID);
    expect(await registry.usedProofs(proofHash)).to.equal(true);

    const unreviewed = await registry.getUnreviewedRecords(patient.address);
    expect(unreviewed).to.deep.equal([recordId]);
  });

  it("rejects invalid oracle signatures and proof replay", async function () {
    await registry.connect(deployer).setTrustedOracle(oracle.address);

    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof:replay"));
    const badSignature = await signProof(proofHash, PROVIDER_ID, badOracle);

    await expect(
      registry.connect(patient).submitVerifiedData(
        CID,
        INTEGRITY_HASH,
        RECORD_TYPE,
        provider.address,
        CONDITION_ID,
        PROVIDER_ID,
        proofHash,
        badSignature
      )
    ).to.be.revertedWith("Invalid oracle signature");

    const signature = await signProof(proofHash, PROVIDER_ID, oracle);
    await registry.connect(patient).submitVerifiedData(
      CID,
      INTEGRITY_HASH,
      RECORD_TYPE,
      provider.address,
      CONDITION_ID,
      PROVIDER_ID,
      proofHash,
      signature
    );

    await expect(
      registry.connect(patient).submitVerifiedData(
        CID,
        INTEGRITY_HASH,
        RECORD_TYPE,
        provider.address,
        CONDITION_ID,
        PROVIDER_ID,
        proofHash,
        signature
      )
    ).to.be.revertedWith("Proof already used");
  });

  it("limits keeper quality actions to verified records and authorized keepers", async function () {
    await registry.connect(deployer).setTrustedOracle(oracle.address);
    await registry.connect(deployer).addKeeper(keeper.address);

    await registry.connect(patient).registerRecord(
      CID,
      INTEGRITY_HASH,
      RECORD_TYPE,
      provider.address,
      CONDITION_ID
    );
    const standardId = await latestPatientRecordId(registry, patient.address);

    await expect(
      registry.connect(keeper).verifyQuality(standardId, "#CBC")
    ).to.be.revertedWith("Record must be origin-verified");

    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof:quality"));
    const signature = await signProof(proofHash, PROVIDER_ID, oracle);
    await registry.connect(patient).submitVerifiedData(
      CID,
      INTEGRITY_HASH,
      RECORD_TYPE,
      provider.address,
      CONDITION_ID,
      PROVIDER_ID,
      proofHash,
      signature
    );
    const verifiedId = await latestPatientRecordId(registry, patient.address);

    await expect(
      registry.connect(provider).verifyQuality(verifiedId, "#CBC")
    ).to.be.revertedWith("Not authorized keeper");

    await expect(registry.connect(keeper).verifyQuality(verifiedId, "#CBC"))
      .to.emit(registry, "QualityVerified")
      .withArgs(verifiedId, keeper.address, "#CBC");

    const reviewed = await registry.getRecord(verifiedId);
    expect(reviewed.isQualityChecked).to.equal(true);
    expect(reviewed.keeperAddress).to.equal(keeper.address);
  });

  it("forwards Data UBI only after keeper finalization of verified data", async function () {
    await registry.connect(deployer).setTrustedOracle(oracle.address);
    await registry.connect(deployer).addKeeper(keeper.address);

    const proofHash = ethers.keccak256(ethers.toUtf8Bytes("proof:ubi"));
    const signature = await signProof(proofHash, PROVIDER_ID, oracle);
    await registry.connect(patient).submitVerifiedData(
      CID,
      INTEGRITY_HASH,
      RECORD_TYPE,
      provider.address,
      CONDITION_ID,
      PROVIDER_ID,
      proofHash,
      signature
    );
    const recordId = await latestPatientRecordId(registry, patient.address);

    const payout = ethers.parseEther("0.25");
    await expect(() =>
      registry.connect(keeper).finalizeRecord(recordId, "#CBC", { value: payout })
    ).to.changeEtherBalances([keeper, patient], [-payout, payout]);
  });
});

describe("RaphaMarket", function () {
  let owner;
  let buyer;
  let treasury;
  let patientPool;
  let computeNode;
  let patientA;
  let patientB;
  let attacker;
  let usdc;
  let market;

  const bounty = 1_000n * 10n ** 6n;
  const queryCommitment = ethers.keccak256(ethers.toUtf8Bytes("cohort-query-v1"));
  const encryptedQueryURI = "bafybeigdyrzt5sfp7udm7hu76h7y55t3krjiiisnq3cmuee6f4q2v7xvji";
  const algoHash = "bafybeifalgoaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  beforeEach(async function () {
    [owner, buyer, treasury, patientPool, computeNode, patientA, patientB, attacker] =
      await ethers.getSigners();

    usdc = await ethers.deployContract("MockUSDC", owner);
    market = await ethers.deployContract(
      "RaphaMarket",
      [await usdc.getAddress(), treasury.address, patientPool.address],
      owner
    );

    await usdc.mint(buyer.address, bounty);
    await usdc.connect(buyer).approve(await market.getAddress(), bounty);
  });

  it("requires committed encrypted queries instead of plaintext query strings", async function () {
    await expect(
      market.connect(buyer).submitJob(
        bounty,
        ethers.ZeroHash,
        encryptedQueryURI,
        algoHash
      )
    ).to.be.revertedWith("Query commitment required");

    await expect(
      market.connect(buyer).submitJob(
        bounty,
        queryCommitment,
        "",
        algoHash
      )
    ).to.be.revertedWith("Encrypted query URI required");
  });

  it("escrows bounty and stores only query commitment plus encrypted query URI", async function () {
    await expect(
      market.connect(buyer).submitJob(bounty, queryCommitment, encryptedQueryURI, algoHash)
    )
      .to.emit(market, "JobSubmitted")
      .withArgs(1, buyer.address, bounty, queryCommitment, encryptedQueryURI);

    const job = await market.getJob(1);
    expect(job.buyer).to.equal(buyer.address);
    expect(job.bountyAmount).to.equal(bounty);
    expect(job.queryCommitment).to.equal(queryCommitment);
    expect(job.encryptedQueryURI).to.equal(encryptedQueryURI);
    expect(job.status).to.equal(0);
    expect(await usdc.balanceOf(await market.getAddress())).to.equal(bounty);
  });

  it("restricts compute lifecycle to authorized nodes and splits settlement 20/80", async function () {
    await market.connect(buyer).submitJob(bounty, queryCommitment, encryptedQueryURI, algoHash);

    await expect(
      market.connect(attacker).startJob(1)
    ).to.be.revertedWith("Not authorized compute node");

    await market.connect(owner).setAuthorizedNode(computeNode.address, true);
    await expect(market.connect(computeNode).startJob(1))
      .to.emit(market, "JobStarted")
      .withArgs(1, computeNode.address);

    await expect(
      market.connect(attacker).finalizeJob(1, [patientA.address], RESULT_CID)
    ).to.be.revertedWith("Not authorized compute node");

    await expect(
      market.connect(computeNode).finalizeJob(
        1,
        [patientA.address, patientB.address],
        RESULT_CID
      )
    )
      .to.emit(market, "JobFinalized")
      .withArgs(1, RESULT_CID, bounty / 5n, (bounty * 4n) / 5n, 2);

    const job = await market.getJob(1);
    expect(job.status).to.equal(2);
    expect(job.patientCount).to.equal(2);
    expect(await usdc.balanceOf(treasury.address)).to.equal(bounty / 5n);
    expect(await usdc.balanceOf(patientPool.address)).to.equal((bounty * 4n) / 5n);
    expect(await usdc.balanceOf(await market.getAddress())).to.equal(0);
  });

  it("refunds buyers on cancellation and prevents cancellation after compute starts", async function () {
    await market.connect(buyer).submitJob(bounty, queryCommitment, encryptedQueryURI, algoHash);

    await expect(market.connect(attacker).cancelJob(1)).to.be.revertedWith("Not job buyer");
    await expect(() => market.connect(buyer).cancelJob(1))
      .to.changeTokenBalances(usdc, [buyer, market], [bounty, -bounty]);

    await usdc.mint(buyer.address, bounty);
    await usdc.connect(buyer).approve(await market.getAddress(), bounty);
    await market.connect(buyer).submitJob(bounty, queryCommitment, encryptedQueryURI, algoHash);
    await market.connect(owner).setAuthorizedNode(computeNode.address, true);
    await market.connect(computeNode).startJob(2);

    await expect(market.connect(buyer).cancelJob(2)).to.be.revertedWith("Job already processing");
  });

  it("refunds buyers when an authorized compute node marks a job failed", async function () {
    await market.connect(buyer).submitJob(bounty, queryCommitment, encryptedQueryURI, algoHash);
    await market.connect(owner).setAuthorizedNode(computeNode.address, true);
    await market.connect(computeNode).startJob(1);

    await expect(() => market.connect(computeNode).failJob(1))
      .to.changeTokenBalances(usdc, [buyer, market], [bounty, -bounty]);

    const job = await market.getJob(1);
    expect(job.status).to.equal(4);
  });
});
