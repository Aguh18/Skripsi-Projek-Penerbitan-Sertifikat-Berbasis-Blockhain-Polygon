const hre = require("hardhat");

async function main() {
    console.log("🚀 Starting deployment to Amoy testnet (Polygon)...");

    // Get the contract factory
    const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");

    console.log("📦 Deploying CertificateRegistry...");

    // Deploy the contract
    const certificateRegistry = await CertificateRegistry.deploy();

    // Wait for deployment to finish (ethers v5 syntax)
    await certificateRegistry.deployed();

    // Get the deployed contract address
    const address = certificateRegistry.address;

    console.log("✅ CertificateRegistry deployed successfully!");
    console.log("📍 Contract Address:", address);
    console.log("🔗 Amoy Explorer:", `https://www.oklink.com/amoy/address/${address}`);

    // Verify the contract on Amoy Explorer
    console.log("🔍 Verifying contract on Amoy Explorer...");

    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: [],
        });
        console.log("✅ Contract verified successfully on Amoy Explorer!");
    } catch (error) {
        console.log("⚠️ Contract verification failed:", error.message);
        console.log("💡 You can verify manually at: https://www.oklink.com/amoy/verify");
    }

    console.log("🎉 Deployment completed!");
    console.log("📋 Summary:");
    console.log("   - Network: Amoy Testnet (Polygon)");
    console.log("   - Chain ID: 80002");
    console.log("   - Contract: CertificateRegistry");
    console.log("   - Address:", address);
    console.log("   - Explorer:", `https://www.oklink.com/amoy/address/${address}`);
    console.log("   - RPC URL: https://rpc-amoy.polygon.technology");

    // Save deployment info to file
    const fs = require('fs');
    const deploymentInfo = {
        network: 'amoy',
        chainId: 80002,
        contract: 'CertificateRegistry',
        address: address,
        explorer: `https://www.oklink.com/amoy/address/${address}`,
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
        'deployment-amoy.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to: deployment-amoy.json");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 