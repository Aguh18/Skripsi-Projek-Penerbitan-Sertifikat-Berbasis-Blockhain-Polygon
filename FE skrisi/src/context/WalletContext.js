import React, { createContext, useEffect, useState } from 'react';
import { NETWORKS, DEFAULT_NETWORK } from '../config/network';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [currentAccount, setCurrentAccount] = useState(null);
    const [currentChainId, setCurrentChainId] = useState(null);

    useEffect(() => {
        const checkWallet = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                setIsWalletConnected(accounts.length > 0);
                setCurrentAccount(accounts[0] || null);
                setCurrentChainId(chainId);
                setIsCorrectNetwork(chainId === NETWORKS[DEFAULT_NETWORK].chainId);
            } else {
                setIsWalletConnected(false);
                setIsCorrectNetwork(false);
                setCurrentAccount(null);
                setCurrentChainId(null);
            }
        };

        checkWallet();

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', checkWallet);
            window.ethereum.on('chainChanged', checkWallet);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', checkWallet);
                window.ethereum.removeListener('chainChanged', checkWallet);
            }
        };
    }, []);

    return (
        <WalletContext.Provider value={{
            isWalletConnected,
            isCorrectNetwork,
            currentAccount,
            currentChainId
        }}>
            {children}
        </WalletContext.Provider>
    );
}; 