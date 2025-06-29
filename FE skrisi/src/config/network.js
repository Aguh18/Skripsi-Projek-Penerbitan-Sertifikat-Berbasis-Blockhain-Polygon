// Network configurations
export const NETWORKS = {
    // hardhat: {
    //     chainId: '0x1B39', // 6969 in hex
    //     chainName: 'Hardhat Local',
    //     rpcUrls: ['http://127.0.0.1:6969'],
    //     nativeCurrency: {
    //         name: 'Ether',
    //         symbol: 'ETH',
    //         decimals: 18,
    //     },
    //     blockExplorerUrls: [],
    // },
    // Untuk Polygon Mainnet, uncomment di bawah ini:
    polygon: {
        chainId: '0x89', // 137 in hex
        chainName: 'Polygon Mainnet',
        rpcUrls: ['https://polygon-rpc.com'],
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        blockExplorerUrls: ['https://polygonscan.com'],
    },
};

// Contract configurations
export const CONTRACTS = {
    certificateRegistry: {
        // address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        // Untuk Polygon Mainnet, uncomment baris di bawah ini:
        address: '0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D',
    },
};

// Default network to use
// export const DEFAULT_NETWORK = 'hardhat';
// Untuk Polygon Mainnet, uncomment baris di bawah ini:
export const DEFAULT_NETWORK = 'polygon';

// IPFS configurations
export const IPFS_CONFIG = {
    gateway: 'https://ipfs.io/ipfs/',
};

// API endpoints
export const API_ENDPOINTS = {
    baseUrl: 'http://localhost:3000/api',
};

// Other configurations
export const APP_CONFIG = {
    maxGasLimit: 5000000,
    defaultGasPrice: 'auto',
}; 