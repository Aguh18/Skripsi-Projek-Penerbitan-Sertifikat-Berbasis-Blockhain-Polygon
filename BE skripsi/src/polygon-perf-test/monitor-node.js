const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");

delete process.env.NODE_OPTIONS;

async function main() {
    const start = Date.now();
    const block = await provider.getBlockNumber();
    const end = Date.now();
    console.log("Current block:", block);
    console.log("RPC latency:", (end - start), "ms");
}

main(); 