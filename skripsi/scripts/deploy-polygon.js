const hre = require("hardhat");

async function main() {
    console.log("🚀 Starting deployment to Polygon mainnet...");

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
    console.log("🔗 Polygon Explorer:", `https://polygonscan.com/address/${address}`);

    // Verify the contract on PolygonScan
    console.log("🔍 Verifying contract on PolygonScan...");

    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: [],
        });
        console.log("✅ Contract verified successfully on PolygonScan!");
    } catch (error) {
        console.log("⚠️ Contract verification failed:", error.message);
        console.log("💡 You can verify manually at: https://polygonscan.com/verifyContract");
    }

    console.log("🎉 Deployment completed!");
    console.log("📋 Summary:");
    console.log("   - Network: Polygon Mainnet");
    console.log("   - Chain ID: 137");
    console.log("   - Contract: CertificateRegistry");
    console.log("   - Address:", address);
    console.log("   - Explorer:", `https://polygonscan.com/address/${address}`);
    console.log("   - RPC URL: https://polygon-rpc.com");

    // Save deployment info to file
    const fs = require('fs');
    const deploymentInfo = {
        network: 'polygon',
        chainId: 137,
        contract: 'CertificateRegistry',
        address: address,
        explorer: `https://polygonscan.com/address/${address}`,
        rpcUrl: 'https://polygon-rpc.com',
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
        'deployment-polygon.json',
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to: deployment-polygon.json");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 