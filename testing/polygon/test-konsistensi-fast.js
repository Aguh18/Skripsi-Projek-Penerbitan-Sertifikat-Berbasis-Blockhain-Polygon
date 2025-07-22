require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";
const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

function generateCertificateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`FAST-${timestamp}-${random}`));
}

function randomAddress() {
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
        addr += Math.floor(Math.random() * 16).toString(16);
    }
    return addr;
}

async function testFastConsistency() {
    console.log("⚡ PENGUJIAN KONSISTENSI DATA - VERSI CEPAT");
    console.log("=".repeat(50));

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i <= 3; i++) {
        console.log(`\n📋 Test ${i}: Menerbitkan sertifikat...`);

        const testData = {
            id: generateCertificateId(),
            certificateTitle: `Sertifikat Fast Test ${i}`,
            expiryDate: "2025-12-31",
            issueDate: new Date().toISOString().slice(0, 10),
            cid: `QmFast${i}${Date.now()}`,
            issuerName: "Universitas Fast",
            recipientName: `Mahasiswa Fast ${i}`,
            targetAddress: randomAddress()
        };

        try {
            // Optimasi gas untuk transaksi cepat
            console.log(`   📝 Menerbitkan sertifikat dengan ID: ${testData.id}`);

            // Estimate gas terlebih dahulu
            const gasEstimate = await contract.estimateGas.issueCertificate(
                testData.id,
                testData.certificateTitle,
                testData.expiryDate,
                testData.issueDate,
                testData.cid,
                testData.issuerName,
                testData.recipientName,
                testData.targetAddress
            );

            console.log(`   ⛽ Gas estimate: ${gasEstimate.toString()}`);

            // Gunakan gas estimate + buffer kecil
            const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

            const tx = await contract.issueCertificate(
                testData.id,
                testData.certificateTitle,
                testData.expiryDate,
                testData.issueDate,
                testData.cid,
                testData.issuerName,
                testData.recipientName,
                testData.targetAddress,
                {
                    gasLimit: gasLimit,
                    maxFeePerGas: ethers.utils.parseUnits("30", "gwei"), // Gas price yang lebih tinggi
                    maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei")
                }
            );

            console.log(`   ⏳ Menunggu konfirmasi transaksi...`);
            console.log(`   🔗 Transaction Hash: ${tx.hash}`);

            // Tunggu konfirmasi dengan timeout
            const receipt = await Promise.race([
                tx.wait(1), // Tunggu 1 konfirmasi
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 60000) // 60 detik timeout
                )
            ]);

            console.log(`   ✅ Transaksi berhasil dalam ${receipt.confirmations} konfirmasi`);

            // Query data dengan timeout
            console.log(`   🔍 Query data dari smart contract...`);
            const onchain = await contract.getCertificate(testData.id);
            const isValid = await contract.verifyCertificate(testData.id);

            // Bandingkan data
            const fields = [
                ['ID', testData.id, onchain.id],
                ['Certificate Title', testData.certificateTitle, onchain.certificateTitle],
                ['Expiry Date', testData.expiryDate, onchain.expiryDate],
                ['Issue Date', testData.issueDate, onchain.issueDate],
                ['CID', testData.cid, onchain.cid],
                ['Issuer Name', testData.issuerName, onchain.issuerName],
                ['Recipient Name', testData.recipientName, onchain.recipientName],
                ['Target Address', testData.targetAddress.toLowerCase(), onchain.targetAddress.toLowerCase()]
            ];

            let matchCount = 0;
            fields.forEach(([field, input, onchainVal]) => {
                if (input === onchainVal) matchCount++;
            });

            const matchRate = (matchCount / fields.length) * 100;
            const allMatch = matchCount === fields.length;

            if (allMatch && isValid) {
                successCount++;
                console.log(`   ✅ Test ${i} BERHASIL - Konsistensi: ${matchRate.toFixed(2)}%`);
            } else {
                failCount++;
                console.log(`   ❌ Test ${i} GAGAL - Konsistensi: ${matchRate.toFixed(2)}%`);
            }

            results.push({
                testNumber: i,
                success: allMatch && isValid,
                matchRate,
                transactionHash: tx.hash,
                confirmations: receipt.confirmations,
                gasUsed: receipt.gasUsed.toString(),
                data: testData,
                onchain: onchain,
                isValid: isValid
            });

        } catch (err) {
            failCount++;
            console.log(`   ❌ Test ${i} ERROR: ${err.message}`);
            results.push({
                testNumber: i,
                success: false,
                error: err.message
            });
        }
    }

    // Generate report
    console.log("\n" + "=".repeat(60));
    console.log("📊 LAPORAN PENGUJIAN KONSISTENSI DATA - VERSI CEPAT");
    console.log("=".repeat(60));
    console.log(`Total Test: ${results.length}`);
    console.log(`Berhasil: ${successCount}`);
    console.log(`Gagal: ${failCount}`);
    console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(2)}%`);

    if (successCount > 0) {
        const avgMatchRate = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.matchRate, 0) / successCount;
        console.log(`Average Match Rate: ${avgMatchRate.toFixed(2)}%`);

        const avgConfirmations = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.confirmations, 0) / successCount;
        console.log(`Average Confirmations: ${avgConfirmations.toFixed(1)}`);

        const avgGasUsed = results
            .filter(r => r.success)
            .reduce((sum, r) => sum + parseInt(r.gasUsed), 0) / successCount;
        console.log(`Average Gas Used: ${avgGasUsed.toFixed(0)}`);
    }

    console.log("=".repeat(60));

    // Save to CSV
    const csvData = ['TestNumber,Success,MatchRate,TransactionHash,Confirmations,GasUsed,Error\n'];
    results.forEach(result => {
        if (result.success) {
            csvData.push(`${result.testNumber},true,${result.matchRate.toFixed(2)},${result.transactionHash},${result.confirmations},${result.gasUsed},\n`);
        } else {
            csvData.push(`${result.testNumber},false,0,,,,"${result.error}"\n`);
        }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hasil_konsistensi_fast_${timestamp}.csv`;
    fs.writeFileSync(filename, csvData.join(''));
    console.log(`📄 File hasil: ${filename}`);

    return {
        total: results.length,
        success: successCount,
        fail: failCount,
        successRate: (successCount / results.length) * 100,
        filename
    };
}

async function main() {
    console.log("🚀 Memulai pengujian konsistensi data versi cepat...");

    // Check environment
    if (!process.env.PRIVATE_KEY) {
        console.error("❌ Error: PRIVATE_KEY tidak ditemukan di file .env");
        console.log("📝 Buat file .env dengan format:");
        console.log("PRIVATE_KEY=your_private_key_here");
        return;
    }

    // Check connection
    try {
        const network = await provider.getNetwork();
        console.log(`🌐 Terhubung ke network: ${network.name} (Chain ID: ${network.chainId})`);

        const balance = await wallet.getBalance();
        console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} MATIC`);

        if (balance.isZero()) {
            console.log("⚠️  Warning: Balance 0, transaksi mungkin gagal");
        }

        // Check gas price
        const gasPrice = await provider.getGasPrice();
        console.log(`⛽ Current Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

    } catch (error) {
        console.error("❌ Error koneksi ke blockchain:", error.message);
        return;
    }

    const result = await testFastConsistency();

    console.log("\n🎉 Pengujian konsistensi data versi cepat selesai!");
    console.log(`📊 Overall Success Rate: ${result.successRate.toFixed(2)}%`);
}

main().catch(console.error); 