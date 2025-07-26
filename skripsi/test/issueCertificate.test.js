const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Certificate Issue Functionality", function () {
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
}); 