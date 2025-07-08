require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

// ID sertifikat terakhir yang diterbitkan
const certificateId = "0x64de4c85eb9ba8a08649e3d7f177a3440c1d90591500905bf67c10d9947c1079";
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
        const csvData = ['No,Hasil,Waktu (detik)\n'];

        for (let i = 1; i <= 100; i++) {
            const start = Date.now();
            const result = await contract.verifyCertificate(certificateId);
            const end = Date.now();
            const time = (end - start) / 1000;
            times.push(time);

            if (result) {
                successCount++;
            } else {
                failCount++;
            }

            console.log(`| ${i.toString().padStart(3)} | ${result ? 'true ' : 'false'} | ${time.toFixed(4).padStart(10)} |`);
            csvData.push(`${i},${result},${time.toFixed(4)}\n`);
        }

        console.log("=".repeat(80));

        // Statistik
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log("\nSTATISTIK:");
        console.log(`Total percobaan: ${times.length}`);
        console.log(`Berhasil: ${successCount}`);
        console.log(`Gagal: ${failCount}`);
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