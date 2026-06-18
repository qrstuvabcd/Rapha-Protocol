const { expect } = require("chai");
const { ethers } = require("hardhat");

const USDC = 1_000_000n;

async function eventArg(contract, tx, eventName, argName) {
  const receipt = await tx.wait();
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed.name === eventName) {
        return parsed.args[argName];
      }
    } catch (_) {
      // Ignore logs from other contracts in the same transaction.
    }
  }
  throw new Error(`${eventName} not found`);
}

async function mintNode(nodeNft, owner, investor, hospital, onboarder, label = "node-1") {
  const hardwareHash = ethers.keccak256(ethers.toUtf8Bytes(`tpm-sgx-measurement:${label}`));
  const tokenId = await eventArg(
    nodeNft,
    await nodeNft.connect(owner).mintNode(
      investor.address,
      hardwareHash,
      hospital.address,
      onboarder.address,
      `ipfs://rapha/${label}`
    ),
    "NodeMinted",
    "tokenId"
  );
  return { tokenId, hardwareHash };
}

async function depositedJobId(vault, tx) {
  return eventArg(vault, tx, "EscrowDeposited", "jobId");
}

async function buildProof(vault, jobId, tokenId, aiCompanyWallet, payloadHash, attestor) {
  const digest = await vault.proofDigestFor(jobId, tokenId, aiCompanyWallet, payloadHash);
  const signature = await attestor.signMessage(ethers.getBytes(digest));
  const proof = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "uint256", "address", "bytes32", "bytes"],
    [jobId, tokenId, aiCompanyWallet, payloadHash, signature]
  );
  return { digest, proof };
}

describe("RaphaNodeNFT and RaphaClearingVault", function () {
  let owner;
  let aiCompany;
  let investor;
  let investor2;
  let hospital;
  let onboarder;
  let treasury;
  let attestor;
  let badAttestor;
  let usdc;
  let nodeNft;
  let vault;
  let tokenId;
  let hardwareHash;

  beforeEach(async function () {
    [owner, aiCompany, investor, investor2, hospital, onboarder, treasury, attestor, badAttestor] =
      await ethers.getSigners();

    usdc = await ethers.deployContract("MockUSDC", [], owner);
    nodeNft = await ethers.deployContract("RaphaNodeNFT", [], owner);
    ({ tokenId, hardwareHash } = await mintNode(nodeNft, owner, investor, hospital, onboarder));

    vault = await ethers.deployContract(
      "RaphaClearingVault",
      [await usdc.getAddress(), await nodeNft.getAddress(), attestor.address, treasury.address],
      owner
    );

    await usdc.mint(aiCompany.address, 10_000n * USDC);
  });

  it("mints an immutable hardware-bound Node NFT with active operational routing", async function () {
    expect(await nodeNft.ownerOf(tokenId)).to.equal(investor.address);
    expect(await nodeNft.nodeHardwareHash(tokenId)).to.equal(hardwareHash);
    expect(await nodeNft.tokenIdByHardwareHash(hardwareHash)).to.equal(tokenId);
    expect(await nodeNft.hospitalTreasury(tokenId)).to.equal(hospital.address);
    expect(await nodeNft.nodeOnboarder(tokenId)).to.equal(onboarder.address);
    expect(await nodeNft.isNodeActive(tokenId)).to.equal(true);

    await expect(
      nodeNft
        .connect(owner)
        .mintNode(investor2.address, hardwareHash, hospital.address, onboarder.address, "ipfs://duplicate")
    ).to.be.revertedWithCustomError(nodeNft, "HardwareHashAlreadyRegistered");
  });

  it("locks USDC escrow and splits 70/20/5/5 after a valid attestation oracle proof", async function () {
    const escrowAmount = 500n * USDC;
    await usdc.connect(aiCompany).approve(await vault.getAddress(), escrowAmount);
    const jobId = await depositedJobId(vault, await vault.connect(aiCompany).depositEscrow(tokenId, escrowAmount));

    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("sgx-dcap-job-receipt:9982"));
    const { digest, proof } = await buildProof(vault, jobId, tokenId, aiCompany.address, payloadHash, attestor);

    await expect(vault.connect(owner).submitProofAndSettle(proof))
      .to.emit(vault, "ProofSettled")
      .withArgs(
        jobId,
        aiCompany.address,
        tokenId,
        escrowAmount,
        350n * USDC,
        100n * USDC,
        25n * USDC,
        25n * USDC,
        digest
      );

    expect(await usdc.balanceOf(hospital.address)).to.equal(350n * USDC);
    expect(await usdc.balanceOf(investor.address)).to.equal(100n * USDC);
    expect(await usdc.balanceOf(onboarder.address)).to.equal(25n * USDC);
    expect(await usdc.balanceOf(treasury.address)).to.equal(25n * USDC);
    expect(await usdc.balanceOf(await vault.getAddress())).to.equal(0);
    expect(await vault.usedProofDigests(digest)).to.equal(true);
  });

  it("pays the current Node NFT owner when yield rights transfer before settlement", async function () {
    const escrowAmount = 1_000n * USDC;
    await nodeNft.connect(investor).transferFrom(investor.address, investor2.address, tokenId);
    await usdc.connect(aiCompany).approve(await vault.getAddress(), escrowAmount);
    const jobId = await depositedJobId(vault, await vault.connect(aiCompany).depositEscrow(tokenId, escrowAmount));

    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("node-owner-transfer-before-settlement"));
    const { proof } = await buildProof(vault, jobId, tokenId, aiCompany.address, payloadHash, attestor);
    await vault.submitProofAndSettle(proof);

    expect(await usdc.balanceOf(investor.address)).to.equal(0);
    expect(await usdc.balanceOf(investor2.address)).to.equal(200n * USDC);
  });

  it("rejects invalid attestation signatures", async function () {
    const escrowAmount = 500n * USDC;
    await usdc.connect(aiCompany).approve(await vault.getAddress(), escrowAmount);
    const jobId = await depositedJobId(vault, await vault.connect(aiCompany).depositEscrow(tokenId, escrowAmount));
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("bad-attestor"));
    const { proof } = await buildProof(vault, jobId, tokenId, aiCompany.address, payloadHash, badAttestor);

    await expect(vault.submitProofAndSettle(proof)).to.be.revertedWithCustomError(vault, "InvalidProofSignature");
  });

  it("rejects proof replay and double settlement", async function () {
    const escrowAmount = 500n * USDC;
    await usdc.connect(aiCompany).approve(await vault.getAddress(), escrowAmount);
    const jobId = await depositedJobId(vault, await vault.connect(aiCompany).depositEscrow(tokenId, escrowAmount));
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("replay-proof"));
    const { proof } = await buildProof(vault, jobId, tokenId, aiCompany.address, payloadHash, attestor);

    await vault.submitProofAndSettle(proof);
    await expect(vault.submitProofAndSettle(proof)).to.be.revertedWithCustomError(vault, "JobAlreadyClosed");
  });

  it("blocks deposits to inactive nodes and refunds an existing escrow if a node is suspended", async function () {
    const escrowAmount = 500n * USDC;
    await nodeNft.connect(owner).setNodeActive(tokenId, false);
    await usdc.connect(aiCompany).approve(await vault.getAddress(), 2n * escrowAmount);
    await expect(vault.connect(aiCompany).depositEscrow(tokenId, escrowAmount)).to.be.revertedWithCustomError(
      vault,
      "UnknownOrInactiveNode"
    );

    await nodeNft.connect(owner).setNodeActive(tokenId, true);
    const jobId = await depositedJobId(vault, await vault.connect(aiCompany).depositEscrow(tokenId, escrowAmount));
    const aiBalanceAfterDeposit = await usdc.balanceOf(aiCompany.address);

    await nodeNft.connect(owner).setNodeActive(tokenId, false);
    await expect(vault.connect(aiCompany).refundInactiveNodeEscrow(jobId, "tamper-switch-open"))
      .to.emit(vault, "EscrowRefunded")
      .withArgs(jobId, aiCompany.address, escrowAmount, "tamper-switch-open");

    expect(await usdc.balanceOf(aiCompany.address)).to.equal(aiBalanceAfterDeposit + escrowAmount);
    await expect(vault.connect(aiCompany).refundInactiveNodeEscrow(jobId, "again")).to.be.revertedWithCustomError(
      vault,
      "JobAlreadyClosed"
    );
  });

  it("restricts registry and oracle administration to the protocol owner", async function () {
    await expect(nodeNft.connect(aiCompany).setNodeActive(tokenId, false)).to.be.revertedWithCustomError(
      nodeNft,
      "OwnableUnauthorizedAccount"
    );
    await expect(vault.connect(aiCompany).setTrustedAttestor(badAttestor.address)).to.be.revertedWithCustomError(
      vault,
      "OwnableUnauthorizedAccount"
    );

    await expect(vault.connect(owner).setTrustedAttestor(badAttestor.address))
      .to.emit(vault, "TrustedAttestorUpdated")
      .withArgs(attestor.address, badAttestor.address);
    expect(await vault.trustedAttestor()).to.equal(badAttestor.address);
  });
});
