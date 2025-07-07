require('dotenv').config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

delete process.env.NODE_OPTIONS;

async function main() {
    const to = "0x000000000000000000000000000000000000dead"; // Alamat tujuan dummy
    const value = ethers.parseEther("0.001"); // 0.001 MATIC

    const tx = await wallet.sendTransaction({ to, value });
    console.log("Tx hash:", tx.hash);

    const start = Date.now();
    const receipt = await tx.wait();
    const end = Date.now();

    console.log("Confirmed in", ((end - start) / 1000).toFixed(2), "seconds");
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Effective gas price:", ethers.formatUnits(receipt.effectiveGasPrice, "gwei"), "gwei");
    console.log("Total fee (MATIC):", ethers.formatEther(receipt.gasUsed * receipt.effectiveGasPrice));
}

main(); 