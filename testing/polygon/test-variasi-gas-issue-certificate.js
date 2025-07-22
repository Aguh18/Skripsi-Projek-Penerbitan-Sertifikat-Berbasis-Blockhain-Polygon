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

async function main() {
    const csvData = ['No,Timestamp,TxHash,GasUsed,GasPrice(gwei),TotalFee(MATIC),Time(s)\n'];
    for (let i = 1; i <= 5; i++) {
        const now = new Date();
        const timestamp = now.toISOString();
        const id = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`VARIASI-GAS-${timestamp}-${Math.random()}`));
        const data = {
            id,
            certificateTitle: `Sertifikat Variasi Gas ${i}`,
            expiryDate: "2025-12-31",
            issueDate: now.toISOString().slice(0, 10),
            cid: `QmVarGas${i}`,
            issuerName: "Universitas Contoh",
            recipientName: `Mahasiswa ${i}`,
            targetAddress: randomAddress()
        };
        try {
            const gasPrice = await provider.getGasPrice();
            const tx = await contract.issueCertificate(
                data.id,
                data.certificateTitle,
                data.expiryDate,
                data.issueDate,
                data.cid,
                data.issuerName,
                data.recipientName,
                data.targetAddress,
                { gasPrice, gasLimit: 500000 }
            );
            const start = Date.now();
            const receipt = await tx.wait();
            const end = Date.now();
            const time = (end - start) / 1000;
            const gasUsed = receipt.gasUsed.toString();
            const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
            const totalFee = ethers.utils.formatEther(receipt.gasUsed.mul(gasPrice));
            csvData.push(`${i},${timestamp},${tx.hash},${gasUsed},${gasPriceGwei},${totalFee},${time.toFixed(4)}\n`);
            console.log(`Tx ${i}: ${tx.hash} | GasUsed: ${gasUsed} | GasPrice: ${gasPriceGwei} gwei | Fee: ${totalFee} MATIC | Time: ${time.toFixed(4)}s`);
        } catch (err) {
            csvData.push(`${i},${timestamp},FAILED,N/A,N/A,N/A,N/A\n`);
            console.log(`Tx ${i} FAILED: ${err.message}`);
        }
        // Tunggu 10 detik sebelum transaksi berikutnya (simulasi waktu berbeda)
        if (i < 5) await new Promise(res => setTimeout(res, 10000));
    }
    fs.writeFileSync('hasil_variasi_gas.csv', csvData.join(''));
    console.log("\nFile hasil_variasi_gas.csv telah dibuat.");
}

main(); 