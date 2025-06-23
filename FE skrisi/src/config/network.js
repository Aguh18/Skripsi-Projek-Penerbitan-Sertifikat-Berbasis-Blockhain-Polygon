// Network configurations
export const NETWORKS = {
    hardhat: {
        chainId: '0x1B39', // 6969 in hex
        chainName: 'Hardhat Local',
        rpcUrls: ['http://127.0.0.1:6969'],
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        blockExplorerUrls: [],
    },
    // Add other networks here if needed
    // sepolia: {
    //     chainId: '0xaa36a7',
    //     chainName: 'Sepolia Testnet',
    //     rpcUrls: ['https://sepolia.infura.io/v3/YOUR-PROJECT-ID'],
    //     nativeCurrency: {
    //         name: 'Sepolia Ether',
    //         symbol: 'SEP',
    //         decimals: 18,
    //     },
    //     blockExplorerUrls: ['https://sepolia.etherscan.io'],
    // },
};

// Contract configurations
export const CONTRACTS = {
    certificateRegistry: {
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        // Add other contract addresses here if needed
    },
};

// Default network to use
export const DEFAULT_NETWORK = 'hardhat';

// IPFS configurations
export const IPFS_CONFIG = {
    gateway: 'https://ipfs.io/ipfs/',
    // Add other IPFS configurations here if needed
};

// API endpoints
export const API_ENDPOINTS = {
    baseUrl: 'http://localhost:3000/api',
    // Add other API endpoints here
};

// Other configurations
export const APP_CONFIG = {
    maxGasLimit: 5000000,
    defaultGasPrice: 'auto',
    // Add other app configurations here
}; 