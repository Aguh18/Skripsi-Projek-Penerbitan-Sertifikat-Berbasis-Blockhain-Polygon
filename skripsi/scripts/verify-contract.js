const hre = require("hardhat");

async function main() {
    const contractAddress = "0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D"; // Ganti dengan address contract Anda

    console.log("🔍 Verifying contract on PolygonScan...");
    console.log("📍 Contract Address:", contractAddress);

    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [],
            contract: "contracts/CertificateRegistry.sol:CertificateRegistry",
            compilerVersion: "0.8.20",
            optimization: true,
            runs: 200
        });

        console.log("✅ Contract verified successfully!");
        console.log("🔗 View contract at: https://polygonscan.com/address/" + contractAddress);

    } catch (error) {
        console.log("❌ Verification failed:", error.message);

        if (error.message.includes("Already Verified")) {
            console.log("ℹ️ Contract is already verified!");
        } else {
            console.log("💡 Manual verification steps:");
            console.log("1. Go to: https://polygonscan.com/verifyContract");
            console.log("2. Enter contract address:", contractAddress);
            console.log("3. Select compiler version: 0.8.20");
            console.log("4. Select optimization: Yes");
            console.log("5. Set optimization runs: 200");
            console.log("6. Copy the entire contract source code");
            console.log("7. Paste and verify");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 