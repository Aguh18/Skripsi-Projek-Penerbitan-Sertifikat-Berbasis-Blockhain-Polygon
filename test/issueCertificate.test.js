const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Certificate Issue Functionality (Polygon)", function () {
    let contract, owner, issuer, verifier, other;
    const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // address di Polygon
    const dummyCertificate = {
        id: "CERT-001",
        certificateTitle: "Blockchain Developer",
        expiryDate: "2025-12-31",
        issueDate: "2024-07-24",
        cid: "QmDummyIpfsCid1234567890",
        issuerName: "Universitas Contoh",
        recipientName: "Budi Santoso",
        targetAddress: "0x1234567890123456789012345678901234567890"
    };

    beforeEach(async function () {
        [owner, issuer, verifier, other] = await ethers.getSigners();
        const Cert = await ethers.getContractFactory("CertificateRegistry");
        contract = await Cert.attach(contractAddress);
    });

    it("should issue certificate by approved issuer", async function () {
        await expect(
            contract.connect(issuer).issueCertificate(
                dummyCertificate.id,
                dummyCertificate.certificateTitle,
                dummyCertificate.expiryDate,
                dummyCertificate.issueDate,
                dummyCertificate.cid,
                dummyCertificate.issuerName,
                dummyCertificate.recipientName,
                dummyCertificate.targetAddress
            )
        ).to.emit(contract, "CertificateIssued");
    });

    it("should fail to issue certificate by non-issuer", async function () {
        await expect(
            contract.connect(verifier).issueCertificate(
                dummyCertificate.id + "-nonissuer",
                dummyCertificate.certificateTitle,
                dummyCertificate.expiryDate,
                dummyCertificate.issueDate,
                dummyCertificate.cid,
                dummyCertificate.issuerName,
                dummyCertificate.recipientName,
                dummyCertificate.targetAddress
            )
        ).to.be.reverted;
    });

    it("should fail to issue certificate with duplicate id", async function () {
        // Pastikan CERT-001 sudah pernah diterbitkan sebelumnya
        await expect(
            contract.connect(issuer).issueCertificate(
                dummyCertificate.id,
                dummyCertificate.certificateTitle,
                dummyCertificate.expiryDate,
                dummyCertificate.issueDate,
                dummyCertificate.cid,
                dummyCertificate.issuerName,
                dummyCertificate.recipientName,
                dummyCertificate.targetAddress
            )
        ).to.be.reverted;
    });

    it("should fail to issue certificate with empty id", async function () {
        await expect(
            contract.connect(issuer).issueCertificate(
                "",
                dummyCertificate.certificateTitle,
                dummyCertificate.expiryDate,
                dummyCertificate.issueDate,
                dummyCertificate.cid,
                dummyCertificate.issuerName,
                dummyCertificate.recipientName,
                dummyCertificate.targetAddress
            )
        ).to.be.reverted;
    });

    it("should emit event on successful issue", async function () {
        await expect(
            contract.connect(issuer).issueCertificate(
                dummyCertificate.id + "-event",
                dummyCertificate.certificateTitle,
                dummyCertificate.expiryDate,
                dummyCertificate.issueDate,
                dummyCertificate.cid,
                dummyCertificate.issuerName,
                dummyCertificate.recipientName,
                dummyCertificate.targetAddress
            )
        ).to.emit(contract, "CertificateIssued");
    });
}); 