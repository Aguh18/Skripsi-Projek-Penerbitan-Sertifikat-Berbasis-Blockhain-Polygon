require('dotenv').config();
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// === EDIT BAGIAN INI SESUAI KONFIGURASI KAMU ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE

// Contoh data sertifikat (isi sesuai kebutuhan)
const certificateData = {
    id: "CERT-001",
    certificateTitle: "Sertifikat Blockchain",
    expiryDate: "2025-12-31",
    issueDate: new Date().toISOString().slice(0, 10),
    cid: "QmExampleCID",
    issuerName: "Universitas Contoh",
    recipientName: "Nama Mahasiswa",
    targetAddress: "ISI_ADDRESS_PENERIMA" // Ganti dengan address penerima
};
// ==============================================

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        console.log("Mengirim transaksi issueCertificate...");
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
        console.log("Tx hash:", tx.hash);
        const start = Date.now();
        const receipt = await tx.wait();
        const end = Date.now();
        console.log("Confirmed in", ((end - start) / 1000).toFixed(2), "seconds");
        console.log("Gas used:", receipt.gasUsed.toString());
        console.log("Effective gas price:", ethers.formatUnits(receipt.effectiveGasPrice, "gwei"), "gwei");
        console.log("Total fee (MATIC):", ethers.formatEther(receipt.gasUsed * receipt.effectiveGasPrice));
    } catch (err) {
        console.error("Gagal mengirim transaksi:", err.message);
    }
}

main(); 