require('dotenv').config();
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// === EDIT BAGIAN INI SESUAI KONFIGURASI KAMU ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE
const certificateData = {
    id: "KONSISTENSI-001",
    certificateTitle: "Sertifikat Konsistensi Data",
    expiryDate: "2025-12-31",
    issueDate: new Date().toISOString().slice(0, 10),
    cid: "QmExampleCID",
    issuerName: "Universitas Contoh",
    recipientName: "Nama Mahasiswa",
    targetAddress: "ISI_ADDRESS_PENERIMA"
};
// ==============================================

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        // Issue certificate
        console.log("Menerbitkan sertifikat...");
        const tx = await contract.issueCertificate(
            certificateData.id,
            certificateData.certificateTitle,
            certificateData.expiryDate,
            certificateData.issueDate,
            certificateData.cid,
            certificateData.issuerName,
            certificateData.recipientName,
            certificateData.targetAddress
        );
        await tx.wait();
        // Get certificate from chain
        console.log("Mengambil data sertifikat dari blockchain...");
        const onchain = await contract.getCertificate(certificateData.id);
        // Bandingkan data input dan data on-chain
        let konsisten = true;
        for (const k of Object.keys(certificateData)) {
            if (onchain[k] && certificateData[k].toLowerCase && typeof onchain[k] === 'string') {
                if (onchain[k].toLowerCase() !== certificateData[k].toLowerCase()) konsisten = false;
            } else if (onchain[k] != certificateData[k]) {
                konsisten = false;
            }
        }
        console.log("Data input:", certificateData);
        console.log("Data on-chain:", onchain);
        console.log("Konsistensi data:", konsisten ? "100% SESUAI" : "TIDAK SESUAI");
    } catch (err) {
        console.error("Gagal menguji konsistensi data:", err.message);
    }
}

main(); 