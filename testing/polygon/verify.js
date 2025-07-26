require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

// Ambil semua certificateId dari hasil_penerbitan.csv
let certificateIds = [];
try {
    const csv = fs.readFileSync("hasil_penerbitan.csv", "utf-8");
    const lines = csv.split("\n").filter(line => line.trim() !== "" && !line.startsWith("No,"));
    for (const line of lines) {
        const cols = line.split(",");
        if (cols.length > 6) {
            certificateIds.push(cols[6]);
        }
    }
} catch (e) {
    console.error("Gagal membaca hasil_penerbitan.csv:", e.message);
    process.exit(1);
}
const totalTests = certificateIds.length * 2;

const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";

const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

delete process.env.NODE_OPTIONS;

async function main() {
    try {
        console.log("Memanggil fungsi verifyCertificate sebanyak 100x...");
        console.log("=".repeat(80));
        console.log("| No | Hasil | Waktu (detik) |");
        console.log("=".repeat(80));

        const times = [];
        let successCount = 0;
        let failCount = 0;
        const csvData = ['No,Hasil,Waktu (detik),id,certificateTitle,cid,expiryDate,issueDate,issuerAddress,issuerName,recipientName,targetAddress,isValid\n'];

        for (let i = 1; i <= totalTests; i++) {
            const certificateId = certificateIds[(i - 1) % certificateIds.length];
            console.log(`\n[${i}/${totalTests}] Verifikasi ID: ${certificateId}`);
            const start = Date.now();
            let result, time, cert;
            try {
                result = await contract.verifyCertificate(certificateId);
                const end = Date.now();
                time = (end - start) / 1000;
                // Fetch certificate data
                try {
                    cert = await contract.getCertificate(certificateId);
                } catch (e) {
                    cert = { id: '', certificateTitle: '', cid: '', expiryDate: '', issueDate: '', issuerAddress: '', issuerName: '', recipientName: '', targetAddress: '', isValid: '' };
                }
                console.log(`Hasil: ${result}, Waktu: ${time.toFixed(4)} detik`);
            } catch (err) {
                const end = Date.now();
                time = (end - start) / 1000;
                result = 'ERROR';
                cert = { id: '', certificateTitle: '', cid: '', expiryDate: '', issueDate: '', issuerAddress: '', issuerName: '', recipientName: '', targetAddress: '', isValid: '' };
                console.log(`Gagal verifikasi: ${err.message}`);
            }
            let timeFormatted = Number(time).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
            csvData.push(`${i},${result},${timeFormatted},${cert.id},${cert.certificateTitle},${cert.cid},${cert.expiryDate},${cert.issueDate},${cert.issuerAddress},${cert.issuerName},${cert.recipientName},${cert.targetAddress},${cert.isValid}\n`);
        }

        console.log("=".repeat(80));

        // Statistik
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const successRate = (successCount / times.length) * 100;

        console.log("\nSTATISTIK:");
        console.log(`Total percobaan: ${times.length}`);
        console.log(`Berhasil: ${successCount}`);
        console.log(`Gagal: ${failCount}`);
        console.log(`Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`Rata-rata waktu: ${avgTime.toFixed(4)} detik`);
        console.log(`Waktu tercepat: ${minTime.toFixed(4)} detik`);
        console.log(`Waktu terlama: ${maxTime.toFixed(4)} detik`);
        console.log("Catatan: Fungsi ini view/read-only, tidak ada biaya gas.");

        // Tambahkan statistik ke CSV
        csvData.push('\n');
        csvData.push('STATISTIK\n');
        csvData.push(`Total percobaan,${times.length}\n`);
        csvData.push(`Berhasil,${successCount}\n`);
        csvData.push(`Gagal,${failCount}\n`);
        csvData.push(`Success Rate (%),${successRate.toFixed(2)}\n`);
        csvData.push(`Rata-rata waktu (detik),${avgTime.toFixed(4)}\n`);
        csvData.push(`Waktu tercepat (detik),${minTime.toFixed(4)}\n`);
        csvData.push(`Waktu terlama (detik),${maxTime.toFixed(4)}\n`);

        // Simpan ke file CSV
        fs.writeFileSync('hasil_verifikasi.csv', csvData.join(''));
        console.log("\nFile Excel (CSV) telah dibuat: hasil_verifikasi.csv");
        console.log("Buka file tersebut di Excel atau Google Sheets");

    } catch (err) {
        console.error("Gagal memanggil verifyCertificate:", err.message);
    }
}

main();