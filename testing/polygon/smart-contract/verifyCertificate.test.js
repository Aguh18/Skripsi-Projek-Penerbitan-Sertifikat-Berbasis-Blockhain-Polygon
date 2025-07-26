const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Certificate Verify Functionality", function () {
    let contract, owner, issuer, verifier, other;
    const validData = {
        recipient: "0x1234567890123456789012345678901234567890",
        hash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    };

    beforeEach(async function () {
        [owner, issuer, verifier, other] = await ethers.getSigners();
        const Cert = await ethers.getContractFactory("CertificateRegistry");
        contract = await Cert.deploy();
        await contract.deployed();
        if (contract.approveIssuer) {
            await contract.connect(owner).approveIssuer(issuer.address);
        }
        await contract.connect(issuer).issueCertificate(validData.recipient, validData.hash);
    });

    it("should verify valid certificate", async function () {
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

    it("should emit event on verification", async function () {
        if (!contract.filters || !contract.filters.CertificateVerified) return this.skip();
        await expect(
            contract.verifyCertificate(validData.hash)
        ).to.emit(contract, "CertificateVerified");
    });
}); 