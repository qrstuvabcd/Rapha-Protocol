const { expect } = require("chai");
const { ethers } = require("hardhat");

const USDC = 1_000_000n;

async function depositedJobId(tollbooth, tx) {
  const receipt = await tx.wait();
  for (const log of receipt.logs) {
    try {
      const parsed = tollbooth.interface.parseLog(log);
      if (parsed.name === "EscrowDeposited") {
        return parsed.args.jobId;
      }
    } catch (_) {
      // Ignore logs from the USDC token.
    }
  }
  throw new Error("EscrowDeposited not found");
}

async function buildProof(tollbooth, jobId, aiCompanyWallet, actualRecords, epochsCompleted, payloadHash, attestor) {
  const digest = await tollbooth["proofDigestFor(bytes32,address,uint256,uint256,bytes32)"](
    jobId,
    aiCompanyWallet,
    actualRecords,
    epochsCompleted,
    payloadHash
  );
  const signature = await attestor.signMessage(ethers.getBytes(digest));
  const proof = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "address", "bytes32", "bytes"],
    [jobId, aiCompanyWallet, payloadHash, signature]
  );
  return { digest, proof };
}

describe("RaphaTollbooth", function () {
  let owner;
  let aiCompany;
  let hospital;
  let treasury;
  let attestor;
  let badAttestor;
  let usdc;
  let tollbooth;

  beforeEach(async function () {
    [owner, aiCompany, hospital, treasury, attestor, badAttestor] = await ethers.getSigners();
    usdc = await ethers.deployContract("MockUSDC", [], owner);
    tollbooth = await ethers.deployContract(
      "RaphaTollbooth",
      [await usdc.getAddress(), hospital.address, treasury.address, attestor.address, USDC, 2n * USDC],
      owner
    );
    await usdc.mint(aiCompany.address, 200_000n * USDC);
  });

  it("locks max budget, settles actual records and epochs, splits 95/5, and refunds unused escrow", async function () {
    await usdc.connect(aiCompany).approve(await tollbooth.getAddress(), 16n * USDC);
    const jobId = await depositedJobId(
      tollbooth,
      await tollbooth.connect(aiCompany)["depositEscrow(uint256,uint256)"](10, 3)
    );
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("sgx-dcap-payload:job-1"));
    const { digest, proof } = await buildProof(tollbooth, jobId, aiCompany.address, 7, 2, payloadHash, attestor);

    const aiBefore = await usdc.balanceOf(aiCompany.address);
    await expect(tollbooth.connect(hospital)["submitProofAndSettle(bytes,uint256,uint256)"](proof, 7, 2))
      .to.emit(tollbooth, "ProofSettled")
      .withArgs(
        jobId,
        aiCompany.address,
        7,
        2,
        11n * USDC,
        10_450_000n,
        550_000n,
        5n * USDC,
        digest
      );

    expect(await usdc.balanceOf(hospital.address)).to.equal(10_450_000n);
    expect(await usdc.balanceOf(treasury.address)).to.equal(550_000n);
    expect(await usdc.balanceOf(aiCompany.address)).to.equal(aiBefore + 5n * USDC);
    expect(await usdc.balanceOf(await tollbooth.getAddress())).to.equal(0);
    expect(await tollbooth.usedProofDigests(digest)).to.equal(true);
  });

  it("settles the 100,000-record clinical imaging example at 0.5 USDC per record", async function () {
    await tollbooth.connect(hospital).setPricing(500_000n, 0);
    await usdc.connect(aiCompany).approve(await tollbooth.getAddress(), 50_000n * USDC);
    const jobId = await depositedJobId(
      tollbooth,
      await tollbooth.connect(aiCompany)["depositEscrow(uint256,uint256)"](100_000, 1)
    );
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("royal-edinburgh-oncology-images"));
    const { proof } = await buildProof(tollbooth, jobId, aiCompany.address, 100_000, 1, payloadHash, attestor);

    await tollbooth["submitProofAndSettle(bytes,uint256,uint256)"](proof, 100_000, 1);

    expect(await usdc.balanceOf(hospital.address)).to.equal(47_500n * USDC);
    expect(await usdc.balanceOf(treasury.address)).to.equal(2_500n * USDC);
    expect(await usdc.balanceOf(await tollbooth.getAddress())).to.equal(0);
  });

  it("rejects invalid attestor signatures", async function () {
    await usdc.connect(aiCompany).approve(await tollbooth.getAddress(), 7n * USDC);
    const jobId = await depositedJobId(
      tollbooth,
      await tollbooth.connect(aiCompany)["depositEscrow(uint256,uint256)"](5, 1)
    );
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("bad-signature"));
    const { proof } = await buildProof(tollbooth, jobId, aiCompany.address, 3, 1, payloadHash, badAttestor);

    await expect(tollbooth["submitProofAndSettle(bytes,uint256,uint256)"](proof, 3, 1)).to.be.revertedWithCustomError(
      tollbooth,
      "InvalidProofSignature"
    );
  });

  it("rejects settlement above escrowed max records", async function () {
    await usdc.connect(aiCompany).approve(await tollbooth.getAddress(), 5n * USDC);
    const jobId = await depositedJobId(tollbooth, await tollbooth.connect(aiCompany)["depositEscrow(uint256)"](5));
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("too-many-records"));
    const { proof } = await buildProof(tollbooth, jobId, aiCompany.address, 6, 0, payloadHash, attestor);

    await expect(tollbooth["submitProofAndSettle(bytes,uint256)"](proof, 6)).to.be.revertedWithCustomError(
      tollbooth,
      "ActualRecordsExceedEscrow"
    );
  });

  it("rejects settlement above escrowed compute epochs", async function () {
    await usdc.connect(aiCompany).approve(await tollbooth.getAddress(), 7n * USDC);
    const jobId = await depositedJobId(
      tollbooth,
      await tollbooth.connect(aiCompany)["depositEscrow(uint256,uint256)"](5, 1)
    );
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("too-many-epochs"));
    const { proof } = await buildProof(tollbooth, jobId, aiCompany.address, 5, 2, payloadHash, attestor);

    await expect(tollbooth["submitProofAndSettle(bytes,uint256,uint256)"](proof, 5, 2)).to.be.revertedWithCustomError(
      tollbooth,
      "ActualEpochsExceedEscrow"
    );
  });
});
