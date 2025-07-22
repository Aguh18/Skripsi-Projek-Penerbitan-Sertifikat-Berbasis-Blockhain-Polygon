require('dotenv').config({ path: __dirname + '/.env' });
const { ethers } = require("ethers");
const abi = require("./ABI.json");

const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D";
const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

function generateCertificateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`OPTIMIZE-${timestamp}-${random}`));
}

function randomAddress() {
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
        addr += Math.floor(Math.random() * 16).toString(16);
    }
    return addr;
}

async function checkNetworkStatus() {
    console.log("🌐 CHECKING NETWORK STATUS");
    console.log("=".repeat(40));

    try {
        const network = await provider.getNetwork();
        console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

        const latestBlock = await provider.getBlockNumber();
        console.log(`Latest Block: ${latestBlock}`);

        const gasPrice = await provider.getGasPrice();
        console.log(`Current Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        const balance = await wallet.getBalance();
        console.log(`Wallet Balance: ${ethers.utils.formatEther(balance)} MATIC`);

        return {
            network,
            latestBlock,
            gasPrice,
            balance
        };

    } catch (error) {
        console.error("❌ Error checking network status:", error.message);
        return null;
    }
}

async function estimateOptimalGas() {
    console.log("\n⛽ ESTIMATING OPTIMAL GAS");
    console.log("=".repeat(40));

    const testData = {
        id: generateCertificateId(),
        certificateTitle: "Gas Optimization Test",
        expiryDate: "2025-12-31",
        issueDate: new Date().toISOString().slice(0, 10),
        cid: "QmGasOptimize",
        issuerName: "Universitas Gas",
        recipientName: "Student Gas",
        targetAddress: randomAddress()
    };

    try {
        // Estimate gas untuk transaksi
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

        console.log(`Gas Estimate: ${gasEstimate.toString()}`);

        // Hitung gas limit dengan berbagai buffer
        const gasLimit10 = gasEstimate.mul(110).div(100); // 10% buffer
        const gasLimit20 = gasEstimate.mul(120).div(100); // 20% buffer
        const gasLimit30 = gasEstimate.mul(130).div(100); // 30% buffer

        console.log(`Gas Limit (10% buffer): ${gasLimit10.toString()}`);
        console.log(`Gas Limit (20% buffer): ${gasLimit20.toString()}`);
        console.log(`Gas Limit (30% buffer): ${gasLimit30.toString()}`);

        return {
            gasEstimate,
            gasLimit10,
            gasLimit20,
            gasLimit30
        };

    } catch (error) {
        console.error("❌ Error estimating gas:", error.message);
        return null;
    }
}

async function testGasOptimization() {
    console.log("\n🚀 TESTING GAS OPTIMIZATION");
    console.log("=".repeat(40));

    const testData = {
        id: generateCertificateId(),
        certificateTitle: "Gas Optimization Test",
        expiryDate: "2025-12-31",
        issueDate: new Date().toISOString().slice(0, 10),
        cid: "QmGasOptimize",
        issuerName: "Universitas Gas",
        recipientName: "Student Gas",
        targetAddress: randomAddress()
    };

    const gasOptions = [
        {
            name: "Low Gas Price",
            maxFeePerGas: ethers.utils.parseUnits("20", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("1", "gwei")
        },
        {
            name: "Medium Gas Price",
            maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei")
        },
        {
            name: "High Gas Price",
            maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei")
        }
    ];

    const results = [];

    for (let i = 0; i < gasOptions.length; i++) {
        const option = gasOptions[i];
        console.log(`\n📋 Test ${i + 1}: ${option.name}`);

        try {
            // Generate new ID untuk setiap test
            testData.id = generateCertificateId();

            console.log(`   Gas Price: ${ethers.utils.formatUnits(option.maxFeePerGas, "gwei")} gwei`);
            console.log(`   Priority Fee: ${ethers.utils.formatUnits(option.maxPriorityFeePerGas, "gwei")} gwei`);

            const startTime = Date.now();

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
                    maxFeePerGas: option.maxFeePerGas,
                    maxPriorityFeePerGas: option.maxPriorityFeePerGas,
                    gasLimit: 300000 // Fixed gas limit
                }
            );

            console.log(`   🔗 Transaction Hash: ${tx.hash}`);
            console.log(`   ⏳ Waiting for confirmation...`);

            const receipt = await Promise.race([
                tx.wait(1),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), 120000) // 2 menit timeout
                )
            ]);

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // dalam detik

            console.log(`   ✅ Success in ${duration.toFixed(2)} seconds`);
            console.log(`   📊 Gas Used: ${receipt.gasUsed.toString()}`);
            console.log(`   🔢 Confirmations: ${receipt.confirmations}`);

            results.push({
                option: option.name,
                success: true,
                duration: duration,
                gasUsed: receipt.gasUsed.toString(),
                confirmations: receipt.confirmations,
                transactionHash: tx.hash
            });

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            results.push({
                option: option.name,
                success: false,
                error: error.message
            });
        }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 GAS OPTIMIZATION RESULTS");
    console.log("=".repeat(60));

    results.forEach((result, index) => {
        if (result.success) {
            console.log(`${index + 1}. ${result.option}:`);
            console.log(`   Duration: ${result.duration.toFixed(2)} seconds`);
            console.log(`   Gas Used: ${result.gasUsed}`);
            console.log(`   Confirmations: ${result.confirmations}`);
        } else {
            console.log(`${index + 1}. ${result.option}: FAILED`);
            console.log(`   Error: ${result.error}`);
        }
    });

    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
        const fastest = successfulResults.reduce((min, r) =>
            r.duration < min.duration ? r : min
        );
        console.log(`\n🏆 Fastest: ${fastest.option} (${fastest.duration.toFixed(2)}s)`);
    }

    return results;
}

async function main() {
    console.log("⚡ GAS OPTIMIZATION TOOL");
    console.log("=".repeat(40));

    // Check environment
    if (!process.env.PRIVATE_KEY) {
        console.error("❌ Error: PRIVATE_KEY tidak ditemukan di file .env");
        return;
    }

    // Check network status
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus) {
        console.error("❌ Cannot proceed without network connection");
        return;
    }

    // Estimate optimal gas
    const gasEstimate = await estimateOptimalGas();
    if (!gasEstimate) {
        console.error("❌ Cannot proceed without gas estimation");
        return;
    }

    // Test gas optimization
    const results = await testGasOptimization();

    console.log("\n🎉 Gas optimization testing completed!");
    console.log("💡 Tips untuk transaksi cepat:");
    console.log("   - Gunakan gas price yang lebih tinggi untuk konfirmasi cepat");
    console.log("   - Monitor network congestion");
    console.log("   - Gunakan gas limit yang tepat (tidak terlalu tinggi/rendah)");
}

main().catch(console.error); 