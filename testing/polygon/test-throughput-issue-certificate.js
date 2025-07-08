require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const abi = require("./ABI.json");
const fs = require('fs');
const { keccak256, toUtf8Bytes } = ethers.utils;

function randomAddress() {
  // Generate random 20-byte hex address
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += Math.floor(Math.random() * 16).toString(16);
  }
  return addr;
}

const batchData = Array.from({ length: 10 }).map((_, i) => {
  const dummyText = `THROUGHPUT-DUMMY-${Date.now()}-${i}-${Math.random()}`;
  const id = keccak256(toUtf8Bytes(dummyText));
  return {
    id,
    certificateTitle: `Sertifikat Throughput ${i + 1}`,
    expiryDate: "2025-12-31",
    issueDate: new Date().toISOString().slice(0, 10),
    cid: `QmExampleCID${i + 1}`,
    issuerName: "Universitas Contoh",
    recipientName: `Mahasiswa ${i + 1}`,
    targetAddress: randomAddress()
  };
});
// ==============================================

const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";
const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
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
  const totalTime = (endAll - startAll) / 1000;
  const throughput = (results.length / totalTime).toFixed(2);

  // Prepare CSV data
  const csvData = [
    'No,Success,TxHash,GasUsed,Error\n'
  ];
  results.forEach((r, i) => {
    csvData.push(`${i + 1},${r.success},${r.txHash || ''},${r.gasUsed || ''},${r.error || ''}\n`);
  });
  csvData.push('\nSUMMARY\n');
  csvData.push(`Total,${results.length}\n`);
  csvData.push(`Success,${success}\n`);
  csvData.push(`Failed,${failed}\n`);
  csvData.push(`Total Time (s),${totalTime.toFixed(4)}\n`);
  csvData.push(`Throughput (tx/s),${throughput}\n`);

  fs.writeFileSync('hasil_throughput.csv', csvData.join(''));
  console.log(`\nTotal: ${results.length}, Success: ${success}, Failed: ${failed}`);
  console.log(`Throughput: ${throughput} tx/s`);
  console.log(`Total Time: ${totalTime.toFixed(4)} detik`);
  if (failed > 0) {
    console.log("Error detail:", results.filter(r => !r.success).map(r => r.error));
  }
  console.log("\nFile hasil_throughput.csv telah dibuat.");
}

main(); 