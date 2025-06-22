const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
    console.log("=== Hardhat Network Accounts ===");
    console.log("Chain ID: 31337");
    console.log("RPC URL: http://127.0.0.1:8545");
    console.log("");

    // Generate accounts from mnemonic
    const mnemonic = "test test test test test test test test test test test junk";
    const accounts = [];

    for (let i = 0; i < 10; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        const wallet = ethers.Wallet.fromMnemonic(mnemonic, path);
        accounts.push(wallet);
    }

    for (let i = 0; i < 10; i++) {
        const account = accounts[i];
        const balance = "10000000000000000000000"; // 10,000 ETH in wei

        console.log(`Account ${i + 1}:`);
        console.log(`  Address: ${account.address}`);
        console.log(`  Private Key: ${account.privateKey}`);
        console.log(`  Balance: ${ethers.utils.formatEther(balance)} ETH`);
        console.log("");
    }

    console.log("=== MetaMask Setup Instructions ===");
    console.log("1. Open MetaMask");
    console.log("2. Click on the network dropdown (top right)");
    console.log("3. Select 'Add Network' or 'Add Network Manually'");
    console.log("4. Fill in the following details:");
    console.log("   - Network Name: Hardhat Local");
    console.log("   - New RPC URL: http://127.0.0.1:8545");
    console.log("   - Chain ID: 31337");
    console.log("   - Currency Symbol: ETH");
    console.log("5. Import one of the private keys above");
    console.log("6. You should see the balance appear!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 