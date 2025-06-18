const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");

    // Get deployer address
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contract with admin (deployer) address:", deployer.address);

    // Deploy the contract
    const certificateRegistry = await CertificateRegistry.deploy();

    // Wait for deployment to finish
    await certificateRegistry.deployed();

    console.log("CertificateRegistry deployed to:", certificateRegistry.address);
}

// Execute the deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 