require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const abi = require("./ABI.json");

// Generate random id menggunakan keccak256 dari waktu dan random number
const randomInput = Date.now().toString() + Math.random().toString();
const randomId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(randomInput));

// === DUMMY DATA UNTUK PENGETESAN ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE

const certificateData = {
    id: randomId,
    certificateTitle: "Sertifikat Uji Coba",
    expiryDate: "2025-12-31",
    issueDate: new Date().toISOString().slice(0, 10),
    cid: "QmDummyCID1234567890",
    issuerName: "Universitas Dummy",
    recipientName: "Budi Santoso",
    targetAddress: "0x1234567890abcdef1234567890abcdef12345678" // Dummy address valid
};
// ================================

const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        console.log("Mengirim transaksi issueCertificate...");
        const gasPrice = await provider.getGasPrice();
        console.log("Estimated gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");
        const tx = await contract.issueCertificate(
            certificateData.id,
            certificateData.certificateTitle,
            certificateData.expiryDate,
            certificateData.issueDate,
            certificateData.cid,
            certificateData.issuerName,
            certificateData.recipientName,
            certificateData.targetAddress,
            { gasLimit: 500000 }
        );
        console.log("Tx hash:", tx.hash);
        const start = Date.now();
        const receipt = await tx.wait();
        const end = Date.now();
        console.log("Confirmed in", ((end - start) / 1000).toFixed(2), "seconds");
        console.log("Gas used:", receipt.gasUsed.toString());
        let gasPriceUsed = receipt.effectiveGasPrice || receipt.gasPrice;
        if (gasPriceUsed) {
            console.log("Effective gas price:", ethers.utils.formatUnits(gasPriceUsed, "gwei"), "gwei");
            const totalFee = receipt.gasUsed.mul(gasPriceUsed);
            console.log("Total fee (MATIC):", ethers.utils.formatEther(totalFee.toString()));
        } else {
            console.log("Gas price tidak tersedia di receipt, tidak bisa menghitung total fee.");
        }
    } catch (err) {
        console.error("Gagal mengirim transaksi:", err.message);
    }
}

main();
 