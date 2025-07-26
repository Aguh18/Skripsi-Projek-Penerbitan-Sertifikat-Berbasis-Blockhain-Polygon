const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Certificate Smart Contract", function () {
    let contract, owner, issuer, verifier, other;
    const validData = {
        recipient: "0x1234567890123456789012345678901234567890",
        hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
        // Tambahkan data lain sesuai kontrak Anda jika perlu
    };

    beforeEach(async function () {
        [owner, issuer, verifier, other] = await ethers.getSigners();
        const Cert = await ethers.getContractFactory("CertificateRegistry");
        contract = await Cert.deploy();
        await contract.deployed();

        // Approve issuer (simulasi admin)
        if (contract.approveIssuer) {
            await contract.connect(owner).approveIssuer(issuer.address);
        }
    });

    it("should issue certificate by approved issuer", async function () {
        await expect(
            contract.connect(issuer).issueCertificate(validData.recipient, validData.hash)
        ).to.emit(contract, "CertificateIssued");
    });

    it("should fail to issue certificate by non-issuer", async function () {
        await expect(
            contract.connect(verifier).issueCertificate(validData.recipient, validData.hash)
        ).to.be.reverted;
    });

    it("should fail to issue certificate with duplicate hash", async function () {
        await contract.connect(issuer).issueCertificate(validData.recipient, validData.hash);
        await expect(
            contract.connect(issuer).issueCertificate(validData.recipient, validData.hash)
        ).to.be.reverted;
    });

    it("should fail to issue certificate with empty data", async function () {
        await expect(
            contract.connect(issuer).issueCertificate(ethers.constants.AddressZero, "")
        ).to.be.reverted;
    });

    it("should verify valid certificate", async function () {
        await contract.connect(issuer).issueCertificate(validData.recipient, validData.hash);
        const isValid = await contract.verifyCertificate(validData.hash);
        expect(isValid).to.equal(true);
    });

    it("should fail to verify non-existent certificate", async function () {
        const isValid = await contract.verifyCertificate("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
        expect(isValid).to.equal(false);
    });

    it("should fail to verify with empty input", async function () {
        await expect(
            contract.verifyCertificate("")
        ).to.be.reverted;
    });

    // Event emission test for verification (if contract emits event)
    it("should emit event on verification", async function () {
        if (!contract.filters || !contract.filters.CertificateVerified) return this.skip();
        await contract.connect(issuer).issueCertificate(validData.recipient, validData.hash);
        await expect(
            contract.verifyCertificate(validData.hash)
        ).to.emit(contract, "CertificateVerified");
    });
}); 