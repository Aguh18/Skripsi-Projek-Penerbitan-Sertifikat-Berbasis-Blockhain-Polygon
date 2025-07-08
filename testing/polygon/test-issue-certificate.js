require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

// === DUMMY DATA UNTUK PENGETESAN ===
const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Sama dengan contract address di FE
// ================================

const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

function generateCertificateData() {
    const randomInput = Date.now().toString() + Math.random().toString();
    const randomId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(randomInput));

    return {
        id: randomId,
        certificateTitle: "Sertifikat Uji Coba",
        expiryDate: "2025-12-31",
        issueDate: new Date().toISOString().slice(0, 10),
        cid: "QmDummyCID1234567890",
        issuerName: "Universitas Dummy",
        recipientName: "Budi Santoso",
        targetAddress: "0x1234567890abcdef1234567890abcdef12345678"
    };
}

async function main() {
    try {
        console.log("Mengirim transaksi issueCertificate sebanyak 20x...");
        console.log("=".repeat(100));
        console.log("| No | Tx Hash | Waktu (detik) | Gas Used | Gas Price (gwei) | Total Fee (MATIC) |");
        console.log("=".repeat(100));

        const csvData = ['No,Tx Hash,Waktu (detik),Gas Used,Gas Price (gwei),Total Fee (MATIC)\n'];
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i <= 20; i++) {
            const certificateData = generateCertificateData();

            console.log(`Penerbitan ke-${i}...`);

            try {
                // Ambil gas price dari network
                const baseGasPrice = await provider.getGasPrice();
                const extra = ethers.utils.parseUnits("0.25", "gwei");
                const gasPrice = baseGasPrice.add(extra);
                console.log(`Gas price dari network: ${ethers.utils.formatUnits(baseGasPrice, "gwei")} gwei`);
                console.log(`Gas price yang digunakan: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

                const tx = await contract.issueCertificate(
                    certificateData.id,
                    certificateData.certificateTitle,
                    certificateData.expiryDate,
                    certificateData.issueDate,
                    certificateData.cid,
                    certificateData.issuerName,
                    certificateData.recipientName,
                    certificateData.targetAddress,
                    { gasPrice: gasPrice, gasLimit: 500000 }
                );

                const start = Date.now();
                const receipt = await tx.wait();
                const end = Date.now();
                const time = (end - start) / 1000;

                let receiptGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;
                let gasPriceGwei = "N/A";
                let totalFee = "N/A";

                if (receiptGasPrice) {
                    gasPriceGwei = ethers.utils.formatUnits(receiptGasPrice, "gwei");
                    const totalFeeWei = receipt.gasUsed.mul(receiptGasPrice);
                    totalFee = ethers.utils.formatEther(totalFeeWei.toString());
                }

                const result = {
                    no: i,
                    txHash: tx.hash,
                    time: time,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: gasPriceGwei,
                    totalFee: totalFee,
                    status: 'SUCCESS'
                };

                results.push(result);
                successCount++;

                console.log(`| ${i.toString().padStart(3)} | ${tx.hash.substring(0, 10)}... | ${time.toFixed(4).padStart(10)} | ${receipt.gasUsed.toString().padStart(8)} | ${gasPriceGwei.padStart(15)} | ${totalFee.padStart(15)} |`);

                csvData.push(`${i},${tx.hash},${time.toFixed(4)},${receipt.gasUsed.toString()},${gasPriceGwei},${totalFee}\n`);

            } catch (error) {
                console.log(`| ${i.toString().padStart(3)} | FAILED | N/A | N/A | N/A | N/A |`);
                csvData.push(`${i},FAILED,N/A,N/A,N/A,N/A\n`);
                failCount++;

                const result = {
                    no: i,
                    txHash: 'FAILED',
                    time: 0,
                    gasUsed: 'N/A',
                    gasPrice: 'N/A',
                    totalFee: 'N/A',
                    status: 'FAILED',
                    error: error.message
                };
                results.push(result);
            }
        }

        console.log("=".repeat(100));

        // Statistik
        const successRate = (successCount / (successCount + failCount)) * 100;
        const successfulResults = results.filter(r => r.status === 'SUCCESS');
        const avgTime = successfulResults.length > 0 ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length : 0;
        const avgGasUsed = successfulResults.length > 0 ? successfulResults.reduce((sum, r) => sum + parseInt(r.gasUsed), 0) / successfulResults.length : 0;
        const minTime = successfulResults.length > 0 ? Math.min(...successfulResults.map(r => r.time)) : 0;
        const maxTime = successfulResults.length > 0 ? Math.max(...successfulResults.map(r => r.time)) : 0;
        const totalFees = successfulResults.filter(r => r.totalFee !== "N/A").map(r => parseFloat(r.totalFee));
        const avgFee = totalFees.length > 0 ? totalFees.reduce((sum, fee) => sum + fee, 0) / totalFees.length : 0;

        console.log("\nSTATISTIK:");
        console.log(`Total penerbitan: ${results.length}`);
        console.log(`Berhasil: ${successCount}`);
        console.log(`Gagal: ${failCount}`);
        console.log(`Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`Rata-rata waktu: ${avgTime.toFixed(4)} detik`);
        console.log(`Waktu tercepat: ${minTime.toFixed(4)} detik`);
        console.log(`Waktu terlama: ${maxTime.toFixed(4)} detik`);
        console.log(`Rata-rata gas used: ${avgGasUsed.toFixed(0)}`);
        console.log(`Rata-rata total fee: ${avgFee.toFixed(6)} MATIC`);

        // Tambahkan statistik ke CSV
        csvData.push('\n');
        csvData.push('STATISTIK\n');
        csvData.push(`Total penerbitan,${results.length}\n`);
        csvData.push(`Berhasil,${successCount}\n`);
        csvData.push(`Gagal,${failCount}\n`);
        csvData.push(`Success Rate (%),${successRate.toFixed(2)}\n`);
        csvData.push(`Rata-rata waktu (detik),${avgTime.toFixed(4)}\n`);
        csvData.push(`Waktu tercepat (detik),${minTime.toFixed(4)}\n`);
        csvData.push(`Waktu terlama (detik),${maxTime.toFixed(4)}\n`);
        csvData.push(`Rata-rata gas used,${avgGasUsed.toFixed(0)}\n`);
        csvData.push(`Rata-rata total fee (MATIC),${avgFee.toFixed(6)}\n`);

        // Simpan ke file CSV
        fs.writeFileSync('hasil_penerbitan.csv', csvData.join(''));
        console.log("\nFile Excel (CSV) telah dibuat: hasil_penerbitan.csv");
        console.log("Buka file tersebut di Excel atau Google Sheets");

    } catch (err) {
        console.error("Gagal mengirim transaksi:", err.message);
    }
}

main(); 