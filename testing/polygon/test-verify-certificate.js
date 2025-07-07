require('dotenv').config();
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// === EDIT BAGIAN INI SESUAI KONFIGURASI KAMU ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE
const certificateId = "CERT-001"; // Ganti dengan id sertifikat yang valid
// ==============================================

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        console.log("Memanggil fungsi verifyCertificate...");
        const start = Date.now();
        // verifyCertificate adalah view function, tapi kita ukur waktu dan biaya call
        const tx = await contract.verifyCertificate(certificateId);
        const end = Date.now();
        console.log("Hasil verifikasi:", tx);
        console.log("Waktu eksekusi:", ((end - start) / 1000).toFixed(2), "seconds");
        // Tidak ada gas fee karena ini view, tapi jika ingin test via transaksi (misal revoke), bisa dibuatkan juga
    } catch (err) {
        console.error("Gagal memanggil verifyCertificate:", err.message);
    }
}

main(); 