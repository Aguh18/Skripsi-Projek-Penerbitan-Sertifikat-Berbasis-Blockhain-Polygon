const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
const privateKey = "PRIVATE_KEY_KAMU";
const wallet = new ethers.Wallet(privateKey, provider);

delete process.env.NODE_OPTIONS;

const BATCH = 10; // Jumlah transaksi paralel
const to = "0x000000000000000000000000000000000000dead";
const value = ethers.parseEther("0.001");

async function sendTx(i) {
  try {
    const tx = await wallet.sendTransaction({ to, value });
    const start = Date.now();
    const receipt = await tx.wait();
    const end = Date.now();
    return { success: true, time: (end - start) / 1000, txHash: tx.hash, gas: receipt.gasUsed.toString() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  let results = [];
  let startAll = Date.now();
  let promises = [];
  for (let i = 0; i < BATCH; i++) {
    promises.push(sendTx(i));
  }
  results = await Promise.all(promises);
  let endAll = Date.now();

  const success = results.filter(r => r.success).length;
  const failed = results.length - success;
  const avgTime = (results.filter(r => r.success).reduce((a, b) => a + b.time, 0) / success).toFixed(2);

  console.log(`Total: ${results.length}, Success: ${success}, Failed: ${failed}`);
  console.log(`Average confirmation time: ${avgTime} seconds`);
  console.log(`Throughput: ${(results.length / ((endAll - startAll) / 1000)).toFixed(2)} tx/s`);
  if (failed > 0) {
    console.log("Failed tx:", results.filter(r => !r.success).map(r => r.error));
  }
}

main(); 