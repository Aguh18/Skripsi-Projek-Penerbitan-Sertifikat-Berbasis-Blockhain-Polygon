const { ethers } = require("ethers");

// Ganti dengan RPC testnet/mainnet Polygon
const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
const privateKey = "PRIVATE_KEY_KAMU"; // Ganti dengan private key testnet
delete process.env.NODE_OPTIONS; // Hindari error memory leak pada beberapa env
const wallet = new ethers.Wallet(privateKey, provider);

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