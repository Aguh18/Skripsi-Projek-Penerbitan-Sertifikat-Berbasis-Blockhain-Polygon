require('dotenv').config();
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

// === EDIT BAGIAN INI SESUAI KONFIGURASI KAMU ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE
const certificateData = {
    id: "VARIASI-001",
    certificateTitle: "Sertifikat Variasi Gas",
    expiryDate: "2025-12-31",
    issueDate: new Date().toISOString().slice(0, 10),
    cid: "QmExampleCID",
    issuerName: "Universitas Contoh",
    recipientName: "Nama Mahasiswa",
    targetAddress: "ISI_ADDRESS_PENERIMA"
};
const logFile = "variasi-gas-log.txt";
// ==============================================

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        console.log("Mengirim transaksi issueCertificate untuk variasi gas...");
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
        const start = Date.now();
        const receipt = await tx.wait();
        const end = Date.now();
        const log = `Date: ${new Date().toISOString()}, Confirmed in: ${((end - start) / 1000).toFixed(2)}s, Gas used: ${receipt.gasUsed.toString()}, Gas price: ${ethers.formatUnits(receipt.effectiveGasPrice, "gwei")} gwei, Total fee: ${ethers.formatEther(receipt.gasUsed * receipt.effectiveGasPrice)} MATIC\n`;
        fs.appendFileSync(logFile, log);
        console.log(log);
    } catch (err) {
        console.error("Gagal mengirim transaksi:", err.message);
    }
}

main(); 