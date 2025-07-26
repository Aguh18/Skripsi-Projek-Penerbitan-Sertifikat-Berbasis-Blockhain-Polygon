require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const fs = require('fs');
const abi = require("./ABI.json");

const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";
const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const issuerKey = process.env.PRIVATE_KEY;
const nonIssuerKey = process.env.NON_ISSUER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const issuer = new ethers.Wallet(issuerKey, provider);
const nonIssuer = new ethers.Wallet(nonIssuerKey, provider);
const contractIssuer = new ethers.Contract(contractAddress, abi, issuer);
const contractNonIssuer = new ethers.Contract(contractAddress, abi, nonIssuer);

const csvData = [
    'No,Skenario,Input,Actor,Expected,Result,Error,TxHash/Output\n'
];

function logSection(title) {
    console.log(`\n=====================`);
    console.log(`>> ${title}`);
    console.log(`=====================\n`);
}

async function testIssueValidCertificate(contractIssuer, validInput, csvData) {
    logSection("[1] Issue Valid Certificate");
    try {
        console.log("Input Data yang Dikirim:");
        console.log(JSON.stringify(validInput, null, 2));
        // Ambil gas price dari network
        const baseGasPrice = await provider.getGasPrice();
        const extra = ethers.utils.parseUnits("0.25", "gwei");
        const gasPrice = baseGasPrice.add(extra);
        console.log(`Gas price dari network: ${ethers.utils.formatUnits(baseGasPrice, "gwei")} gwei`);
        console.log(`Gas price yang digunakan: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        const tx = await contractIssuer.issueCertificate(
            validInput.id, validInput.certificateTitle, validInput.expiryDate, validInput.issueDate,
            validInput.cid, validInput.issuerName, validInput.recipientName, validInput.targetAddress,
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

        // Format semua data numerik agar mudah dibaca, tanpa pemisah ribuan
        let timeFormatted = Number(time).toFixed(4);
        let gasUsedFormatted = receipt.gasUsed.toString();
        let gasPriceFormatted = gasPriceGwei !== "N/A" ? Number(gasPriceGwei).toFixed(6) : gasPriceGwei;
        let totalFeeFormatted = totalFee;
        if (totalFee !== "N/A") {
            totalFeeFormatted = Number(totalFee).toFixed(6);
        }

        console.log(`|  1 | ${tx.hash.substring(0, 10)}... | ${timeFormatted.padStart(10)} | ${gasUsedFormatted.padStart(8)} | ${gasPriceFormatted.padStart(15)} | ${totalFeeFormatted.padStart(15)} |`);
        console.log("Tx Hash:", tx.hash);
        console.log("Total Fee (MATIC):", totalFeeFormatted);
        console.log("Menunggu data on-chain...");
        // Fetch data dari smart contract
        let onchain = null;
        try {
            onchain = await contractIssuer.getCertificate(validInput.id);
            console.log("Data Sertifikat yang di-fetch dari smart contract:");
            console.log(JSON.stringify(onchain, null, 2));
        } catch (e) {
            console.log("Gagal fetch data sertifikat dari smart contract:", e.message);
        }
        csvData.push(`1,Issue valid certificate,${validInput.id},Issuer,Success,Success,,${tx.hash},${timeFormatted},${gasUsedFormatted},${gasPriceFormatted},${totalFeeFormatted},${validInput.certificateTitle},${validInput.expiryDate},${validInput.issueDate},${validInput.cid},${validInput.issuerName},${validInput.recipientName},${validInput.targetAddress}
`);
        return validInput.id;
    } catch (e) {
        console.log("❌ Gagal:", e.message);
        csvData.push(`1,Issue valid certificate,${validInput.id},Issuer,Success,Fail,${e.message.replace(/\n/g, ' ')},,,,,,,,,,,
`);
        return null;
    }
}

async function testIssueByNonIssuer(contractNonIssuer, validInput, csvData) {
    logSection("[2] Issue oleh Non-Issuer");
    const nonIssuerInput = { ...validInput, id: ethers.utils.hexlify(ethers.utils.randomBytes(32)) };
    try {
        console.log("Input ID:", nonIssuerInput.id);
        // Ambil gas price dari network (sama seperti skenario 1)
        const baseGasPrice = await provider.getGasPrice();
        const extra = ethers.utils.parseUnits("0.25", "gwei");
        const gasPrice = baseGasPrice.add(extra);
        console.log(`Gas price dari network: ${ethers.utils.formatUnits(baseGasPrice, "gwei")} gwei`);
        console.log(`Gas price yang digunakan: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
        const tx = await contractNonIssuer.issueCertificate(
            nonIssuerInput.id, nonIssuerInput.certificateTitle, nonIssuerInput.expiryDate, nonIssuerInput.issueDate,
            nonIssuerInput.cid, nonIssuerInput.issuerName, nonIssuerInput.recipientName, nonIssuerInput.targetAddress,
            { gasPrice: gasPrice, gasLimit: 500000 }
        );
        await tx.wait();
        console.log("❗ Berhasil (Seharusnya Gagal): Non-Issuer bisa issue!");
        console.log("Tx Hash:", tx.hash);
        csvData.push(`2,Issue by non-issuer,-,User,Revert/error,Success,,${tx.hash}\n`);
    } catch (e) {
        console.log("✅ Gagal sesuai harapan:", e.message);
        csvData.push(`2,Issue by non-issuer,-,User,Revert/error,Fail,${e.message.replace(/\n/g, ' ')},\n`);
    }
}

async function testIssueWithDuplicateID(contractIssuer, duplicateId, validInput, csvData) {
    logSection("[3] Issue dengan Duplicate ID");
    try {
        console.log("Input ID:", duplicateId);
        // Ambil gas price dari network (sama seperti skenario 1)
        const baseGasPrice = await provider.getGasPrice();
        const extra = ethers.utils.parseUnits("0.25", "gwei");
        const gasPrice = baseGasPrice.add(extra);
        console.log(`Gas price dari network: ${ethers.utils.formatUnits(baseGasPrice, "gwei")} gwei`);
        console.log(`Gas price yang digunakan: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
        const tx = await contractIssuer.issueCertificate(
            duplicateId, validInput.certificateTitle, validInput.expiryDate, validInput.issueDate,
            validInput.cid, validInput.issuerName, validInput.recipientName, validInput.targetAddress,
            { gasPrice: gasPrice, gasLimit: 500000 }
        );
        await tx.wait();
        console.log("❗ Berhasil (Seharusnya Gagal): Duplicate ID diterima");
        console.log("Tx Hash:", tx.hash);
        // Fetch data dari smart contract
        let onchain = null;
        try {
            onchain = await contractIssuer.getCertificate(duplicateId);
            console.log("Data Sertifikat (Duplicate ID) yang di-fetch dari smart contract:");
            console.log(JSON.stringify(onchain, null, 2));
        } catch (e) {
            console.log("Gagal fetch data sertifikat dari smart contract:", e.message);
        }
        csvData.push(`3,Issue with duplicate ID,${duplicateId},Issuer,Revert/error,Success,,${tx.hash}\n`);
    } catch (e) {
        console.log("✅ Gagal sesuai harapan:", e.message);
        csvData.push(`3,Issue with duplicate ID,${duplicateId},Issuer,Revert/error,Fail,${e.message.replace(/\n/g, ' ')},\n`);
    }
}

async function testVerifyValidCertificate(contractIssuer, certId, csvData) {
    logSection("[4] Verifikasi Sertifikat Valid");
    try {
        console.log("Input ID:", certId);
        const result = await contractIssuer.verifyCertificate(certId);
        console.log("✅ Hasil Verifikasi:", result);
        // Fetch data dari smart contract
        let onchain = null;
        try {
            onchain = await contractIssuer.getCertificate(certId);
            console.log("Data Sertifikat yang di-fetch dari smart contract:");
            console.log(JSON.stringify(onchain, null, 2));
        } catch (e) {
            console.log("Gagal fetch data sertifikat dari smart contract:", e.message);
        }
        csvData.push(`4,Verify valid certificate,${certId},Verifier,Status valid,Success,,${JSON.stringify(result)}\n`);
    } catch (e) {
        console.log("❌ Gagal:", e.message);
        csvData.push(`4,Verify valid certificate,${certId},Verifier,Status valid,Fail,${e.message.replace(/\n/g, ' ')},\n`);
    }
}

async function testVerifyNonExistentCertificate(contractIssuer, csvData) {
    logSection("[5] Verifikasi Sertifikat Tidak Ada");
    const fakeId = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    try {
        console.log("Input ID:", fakeId);
        const result = await contractIssuer.verifyCertificate(fakeId);
        console.log("ℹ️ Hasil:", result);
        // Fetch data dari smart contract
        let onchain = null;
        try {
            onchain = await contractIssuer.getCertificate(fakeId);
            console.log("Data Sertifikat (Non-Existent) yang di-fetch dari smart contract:");
            console.log(JSON.stringify(onchain, null, 2));
        } catch (e) {
            console.log("Gagal fetch data sertifikat dari smart contract:", e.message);
        }
        csvData.push(`5,Verify non-existent certificate,${fakeId},Verifier,Status not valid,Success,,${JSON.stringify(result)}\n`);
    } catch (e) {
        console.log("❌ Gagal:", e.message);
        csvData.push(`5,Verify non-existent certificate,invalid,Verifier,Status not valid,Fail,${e.message.replace(/\n/g, ' ')},\n`);
    }
}

async function testVerifyWithEmptyInput(contractIssuer, csvData) {
    logSection("[6] Verifikasi Input Kosong");
    try {
        const result = await contractIssuer.verifyCertificate("");
        console.log("ℹ️ Hasil:", result);
        // Fetch data dari smart contract
        let onchain = null;
        try {
            onchain = await contractIssuer.getCertificate("");
            console.log("Data Sertifikat (Empty Input) yang di-fetch dari smart contract:");
            console.log(JSON.stringify(onchain, null, 2));
        } catch (e) {
            console.log("Gagal fetch data sertifikat dari smart contract:", e.message);
        }
        csvData.push(`6,Verify with empty input,empty,Verifier,Revert/error,Success,,${JSON.stringify(result)}\n`);
    } catch (e) {
        console.log("✅ Gagal sesuai harapan:", e.message);
        csvData.push(`6,Verify with empty input,empty,Verifier,Revert/error,Fail,${e.message.replace(/\n/g, ' ')},\n`);
    }
}

async function main() {
    logSection("Memulai Pengujian Sertifikat");
    const balanceIssuer = await provider.getBalance(issuer.address);
    const balanceNonIssuer = await provider.getBalance(nonIssuer.address);
    console.log(`Issuer: ${issuer.address}`);
    console.log(`Non-Issuer: ${nonIssuer.address}`);
    console.log(`Saldo Issuer     : ${ethers.utils.formatEther(balanceIssuer)} MATIC`);
    console.log(`Saldo Non-Issuer : ${ethers.utils.formatEther(balanceNonIssuer)} MATIC\n`);

    let validInput = {
        id: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
        certificateTitle: "Sertifikat Skenario",
        expiryDate: "2025-12-31",
        issueDate: new Date().toISOString().slice(0, 10),
        cid: "https://gateway.pinata.cloud/ipfs/QmTHe3ihMt1djuwbcRrg7vZUN4c2aysoKzEiFs9sU1iPxj",
        issuerName: "Universitas Skenario",
        recipientName: "Tester",
        targetAddress: issuer.address
    };

    // 1. Issue valid certificate
    const certId = await testIssueValidCertificate(contractIssuer, validInput, csvData);
    // 2. Issue by non-issuer
    await testIssueByNonIssuer(contractNonIssuer, validInput, csvData);
    // 3. Issue with duplicate ID
    await testIssueWithDuplicateID(contractIssuer, certId, validInput, csvData);
    // 4. Verify valid certificate
    await testVerifyValidCertificate(contractIssuer, certId, csvData);
    // 5. Verify non-existent certificate
    await testVerifyNonExistentCertificate(contractIssuer, csvData);
    // 6. Verify with empty input
    await testVerifyWithEmptyInput(contractIssuer, csvData);

    fs.writeFileSync('hasil_skenario.csv', csvData.join(''));
    logSection("✅ Semua pengujian selesai. Hasil dicatat di 'hasil_skenario.csv'");
}

main();
