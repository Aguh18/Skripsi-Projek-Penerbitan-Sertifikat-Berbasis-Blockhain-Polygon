require('dotenv').config();
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// === EDIT BAGIAN INI SESUAI KONFIGURASI KAMU ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE
const batchIds = [
    "BATCH-001",
    // Tambahkan id sertifikat lain sesuai kebutuhan
];
// ==============================================

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function verifyCert(id) {
    try {
        const res = await contract.verifyCertificate(id);
        return { success: true, result: res };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function main() {
    let results = [];
    for (let i = 0; i < batchIds.length; i++) {
        console.log(`Verifikasi sertifikat ke-${i + 1}...`);
        const res = await verifyCert(batchIds[i]);
        results.push(res);
    }
    const success = results.filter(r => r.success).length;
    const failed = results.length - success;
    console.log(`\nTotal: ${results.length}, Success: ${success}, Failed: ${failed}`);
    if (failed > 0) {
        console.log("Error detail:", results.filter(r => !r.success).map(r => r.error));
    }
}

main(); 