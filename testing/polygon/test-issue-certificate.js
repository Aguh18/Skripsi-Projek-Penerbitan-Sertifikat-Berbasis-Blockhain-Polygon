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

function generateCertificateData(iteration) {
    // Generate dummy id dengan panjang 66 karakter (0x + 64 hex)
    const randomHex = [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    const dummyId = "0x" + randomHex;
    return {
        id: dummyId,
        certificateTitle: `Sertifikat Uji Coba #${iteration}`,
        expiryDate: `2025-12-${String(10 + iteration).padStart(2, '0')}`,
        issueDate: new Date(Date.now() + iteration * 86400000).toISOString().slice(0, 10),
        cid: `https://gateway.pinata.cloud/ipfs/QmTHe3ihMt1djuwbcRrg7vZUN4c2aysoKzEiFs9sU1iPxj?dummy=${iteration}`,
        issuerName: `Universitas Dummy ${iteration}`,
        recipientName: `Budi Santoso ${iteration}`,
        targetAddress: `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`
    };
}

async function main() {
    try {
        console.log("Mengirim transaksi issueCertificate sebanyak 20x...");
        console.log("=".repeat(100));
        console.log("| No | Tx Hash | Waktu (detik) | Gas Used | Gas Price (gwei) | Total Fee (MATIC) |");
        console.log("=".repeat(100));

        const csvData = ['No,Tx Hash,Waktu (detik),Gas Used,Gas Price (gwei),Total Fee (MATIC),ID,Title,Expiry,IssueDate,CID,Issuer,Recipient,TargetAddress\n'];
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i <= 15; i++) {
            const certificateData = generateCertificateData(i);

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

                // Format semua data numerik agar mudah dibaca, tanpa pemisah ribuan
                let timeFormatted = Number(time).toFixed(4);
                let gasUsedFormatted = receipt.gasUsed.toString();
                let gasPriceFormatted = gasPriceGwei !== "N/A" ? Number(gasPriceGwei).toFixed(6) : gasPriceGwei;
                let totalFeeFormatted = totalFee;
                if (totalFee !== "N/A") {
                    totalFeeFormatted = Number(totalFee).toFixed(6);
                }
                csvData.push(`${i},${tx.hash},${timeFormatted},${gasUsedFormatted},${gasPriceFormatted},${totalFeeFormatted},${certificateData.id},${certificateData.certificateTitle},${certificateData.expiryDate},${certificateData.issueDate},${certificateData.cid},${certificateData.issuerName},${certificateData.recipientName},${certificateData.targetAddress}\n`);

            } catch (error) {
                console.log(`| ${i.toString().padStart(3)} | FAILED | N/A | N/A | N/A | N/A |`);
                csvData.push(`${i},FAILED,N/A,N/A,N/A,N/A,${certificateData.id},${certificateData.certificateTitle},${certificateData.expiryDate},${certificateData.issueDate},${certificateData.cid},${certificateData.issuerName},${certificateData.recipientName},${certificateData.targetAddress}\n`);
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