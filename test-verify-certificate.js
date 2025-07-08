require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// ID sertifikat terakhir yang diterbitkan
const certificateId = "0xacb671bd02f6403ac3b9d56d34e6ed70565d756ae1dbd55fe61dc709ed2b42c9";
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";

const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        console.log("Memanggil fungsi verifyCertificate...");
        const start = Date.now();
        const result = await contract.verifyCertificate(certificateId);
        const end = Date.now();
        console.log("Hasil verifikasi:", result);
        console.log("Waktu eksekusi:", ((end - start) / 1000).toFixed(4), "detik");
        console.log("Catatan: Fungsi ini view/read-only, tidak ada biaya gas.");
    } catch (err) {
        console.error("Gagal memanggil verifyCertificate:", err.message);
    }
}

main(); 