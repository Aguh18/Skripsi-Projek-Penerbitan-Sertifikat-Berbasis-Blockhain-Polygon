require('dotenv').config();
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// === EDIT BAGIAN INI SESUAI KONFIGURASI KAMU ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE
const batchData = [
  // Isi array dengan data sertifikat berbeda untuk setiap transaksi
  {
    id: "THR-001",
    certificateTitle: "Sertifikat Throughput 1",
    expiryDate: "2025-12-31",
    issueDate: new Date().toISOString().slice(0, 10),
    cid: "QmExampleCID1",
    issuerName: "Universitas Contoh",
    recipientName: "Mahasiswa 1",
    targetAddress: "ISI_ADDRESS_PENERIMA_1"
  },
  // Tambahkan data lain sesuai kebutuhan
];
// ==============================================

const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function issueCert(data) {
  try {
    const tx = await contract.issueCertificate(
      data.id,
      data.certificateTitle,
      data.expiryDate,
      data.issueDate,
      data.cid,
      data.issuerName,
      data.recipientName,
      data.targetAddress
    );
    const receipt = await tx.wait();
    return { success: true, txHash: tx.hash, gasUsed: receipt.gasUsed.toString() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  const startAll = Date.now();
  const promises = batchData.map(data => issueCert(data));
  const results = await Promise.all(promises);
  const endAll = Date.now();
  const success = results.filter(r => r.success).length;
  const failed = results.length - success;
  console.log(`\nTotal: ${results.length}, Success: ${success}, Failed: ${failed}`);
  console.log(`Throughput: ${(results.length / ((endAll - startAll) / 1000)).toFixed(2)} tx/s`);
  if (failed > 0) {
    console.log("Error detail:", results.filter(r => !r.success).map(r => r.error));
  }
}

main(); 