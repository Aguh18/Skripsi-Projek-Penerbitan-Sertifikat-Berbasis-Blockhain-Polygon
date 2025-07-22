require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";
const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

function randomAddress() {
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
        addr += Math.floor(Math.random() * 16).toString(16);
    }
    return addr;
}

function generateCertificateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`KONSISTENSI-${timestamp}-${random}`));
}

async function testDataConsistency() {
    console.log("🚀 Memulai pengujian konsistensi data sertifikat...");
    
    const csvData = ['No,ID,Field,Input,OnChain,Match,Notes\n'];
    let testCount = 0;
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i <= 5; i++) {
        testCount++;
        console.log(`\n📋 Test ${i}: Menerbitkan sertifikat...`);
        
        const now = new Date();
        const id = generateCertificateId();
        const data = {
            id,
            certificateTitle: `Sertifikat Konsistensi Test ${i}`,
            expiryDate: "2025-12-31",
            issueDate: now.toISOString().slice(0, 10),
            cid: `QmKonsistensiTest${i}${Date.now()}`,
            issuerName: "Universitas Contoh",
            recipientName: `Mahasiswa Test ${i}`,
            targetAddress: randomAddress()
        };

        try {
            // Issue certificate
            console.log(`   📝 Menerbitkan sertifikat dengan ID: ${id}`);
            const tx = await contract.issueCertificate(
                data.id,
                data.certificateTitle,
                data.expiryDate,
                data.issueDate,
                data.cid,
                data.issuerName,
                data.recipientName,
                data.targetAddress,
                { gasLimit: 500000 }
            );
            
            console.log(`   ⏳ Menunggu konfirmasi transaksi...`);
            const receipt = await tx.wait();
            console.log(`   ✅ Transaksi berhasil: ${receipt.transactionHash}`);

            // Query data dari smart contract
            console.log(`   🔍 Query data dari smart contract...`);
            const onchain = await contract.getCertificate(data.id);
            
            // Bandingkan semua field
            const fields = [
                ['id', data.id, onchain.id],
                ['certificateTitle', data.certificateTitle, onchain.certificateTitle],
                ['expiryDate', data.expiryDate, onchain.expiryDate],
                ['issueDate', data.issueDate, onchain.issueDate],
                ['cid', data.cid, onchain.cid],
                ['issuerName', data.issuerName, onchain.issuerName],
                ['recipientName', data.recipientName, onchain.recipientName],
                ['targetAddress', data.targetAddress.toLowerCase(), onchain.targetAddress.toLowerCase()]
            ];

            let allFieldsMatch = true;
            fields.forEach(([field, input, onChainVal]) => {
                const match = input === onChainVal;
                const notes = match ? 'OK' : 'MISMATCH';
                csvData.push(`${i},${data.id},${field},"${input}","${onChainVal}",${match},${notes}\n`);
                
                if (!match) {
                    allFieldsMatch = false;
                    console.log(`   ❌ Field ${field} tidak konsisten:`);
                    console.log(`      Input: ${input}`);
                    console.log(`      OnChain: ${onChainVal}`);
                }
            });

            // Test verifikasi sertifikat
            console.log(`   🔍 Testing verifikasi sertifikat...`);
            const isValid = await contract.verifyCertificate(data.id);
            csvData.push(`${i},${data.id},isValid,true,${isValid},${isValid === true},${isValid ? 'OK' : 'INVALID'}\n`);

            if (allFieldsMatch && isValid) {
                successCount++;
                console.log(`   ✅ Test ${i} BERHASIL - Semua data konsisten`);
            } else {
                failCount++;
                console.log(`   ❌ Test ${i} GAGAL - Ada data yang tidak konsisten`);
            }

        } catch (err) {
            failCount++;
            console.log(`   ❌ Test ${i} ERROR: ${err.message}`);
            csvData.push(`${i},${data.id},ERROR,N/A,N/A,false,${err.message}\n`);
        }
    }

    // Tulis hasil ke file CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hasil_konsistensi_data_${timestamp}.csv`;
    fs.writeFileSync(filename, csvData.join(''));
    
    // Tampilkan ringkasan
    console.log("\n" + "=".repeat(60));
    console.log("📊 RINGKASAN PENGUJIAN KONSISTENSI DATA");
    console.log("=".repeat(60));
    console.log(`Total Test: ${testCount}`);
    console.log(`Berhasil: ${successCount}`);
    console.log(`Gagal: ${failCount}`);
    console.log(`Success Rate: ${((successCount/testCount)*100).toFixed(2)}%`);
    console.log(`File hasil: ${filename}`);
    console.log("=".repeat(60));

    return {
        total: testCount,
        success: successCount,
        fail: failCount,
        successRate: (successCount/testCount)*100,
        filename: filename
    };
}

// Fungsi untuk test batch consistency
async function testBatchConsistency() {
    console.log("\n🔄 Memulai pengujian konsistensi batch...");
    
    const batchSize = 3;
    const ids = [];
    const certificateTitles = [];
    const expiryDates = [];
    const issueDates = [];
    const cids = [];
    const issuerNames = [];
    const recipientNames = [];
    const targetAddresses = [];

    // Prepare batch data
    for (let i = 1; i <= batchSize; i++) {
        const now = new Date();
        const id = generateCertificateId();
        ids.push(id);
        certificateTitles.push(`Batch Certificate ${i}`);
        expiryDates.push("2025-12-31");
        issueDates.push(now.toISOString().slice(0, 10));
        cids.push(`QmBatch${i}${Date.now()}`);
        issuerNames.push("Universitas Contoh");
        recipientNames.push(`Batch Student ${i}`);
        targetAddresses.push(randomAddress());
    }

    try {
        console.log(`📦 Menerbitkan ${batchSize} sertifikat dalam batch...`);
        const tx = await contract.issueCertificatesBulk(
            ids,
            certificateTitles,
            expiryDates,
            issueDates,
            cids,
            issuerNames,
            recipientNames,
            targetAddresses,
            { gasLimit: 2000000 }
        );
        
        const receipt = await tx.wait();
        console.log(`✅ Batch transaction berhasil: ${receipt.transactionHash}`);

        // Verify each certificate in batch
        console.log("🔍 Verifikasi setiap sertifikat dalam batch...");
        for (let i = 0; i < batchSize; i++) {
            const onchain = await contract.getCertificate(ids[i]);
            const isValid = await contract.verifyCertificate(ids[i]);
            
            console.log(`   Certificate ${i+1}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
            console.log(`   ID: ${ids[i]}`);
            console.log(`   Title: ${onchain.certificateTitle}`);
            console.log(`   Recipient: ${onchain.recipientName}`);
        }

    } catch (err) {
        console.log(`❌ Batch test error: ${err.message}`);
    }
}

async function main() {
    try {
        // Test individual consistency
        const result = await testDataConsistency();
        
        // Test batch consistency
        await testBatchConsistency();
        
        console.log("\n🎉 Pengujian konsistensi data selesai!");
        
    } catch (error) {
        console.error("❌ Error dalam pengujian:", error);
    }
}

main(); 