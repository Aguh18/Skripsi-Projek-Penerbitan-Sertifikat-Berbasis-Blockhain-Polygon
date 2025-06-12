import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import axios from 'axios';
import { getEnv } from '../utils/env';
import { useAuth } from '../context/AuthContext';



const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const baseUrl = process.env.REACT_APP_BASE_URL;

function Login() {
    const [account, setAccount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [walletType, setWalletType] = useState(null);
    const navigate = useNavigate();
    const { login, logout } = useAuth();

    const connectMetaMask = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                setIsLoading(true);
                setWalletType('metamask');
                // Request account access first
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                if (!accounts || accounts.length === 0) throw new Error("No accounts found");
                const walletAddress = accounts[0];
                // ethers v6: BrowserProvider
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                // Buat pesan untuk ditandatangani
                const nonce = Math.random().toString(36).substring(2);
                const message = `Sign to login to MyDapp at ${new Date().toISOString()} with nonce: ${nonce}`;
                // ethers v6: signMessage ada di signer
                const signature = await signer.signMessage(message);
                // Kirim ke backend
                const response = await axios.post(baseUrl + "/api/account/login", {
                    walletAddress,
                    message,
                    signature,
                    walletType: 'metamask'
                });

                if (response.status !== 200) {
                    throw new Error("Login failed");
                }

                const { token, user } = response.data.data;
                console.log('Login response:', response.data.data); // Debug log

                // Store all user data including role in localStorage
                localStorage.setItem("walletAddress", walletAddress);
                localStorage.setItem("token", token);
                localStorage.setItem("walletType", "metamask");


                const userData = {
                    walletAddress,
                    name: user.name || '-',
                    email: user.email || '-',
                    role: user.role || 'verifier'
                };
                console.log('Storing user data:', userData); // Debug log
                localStorage.setItem('userProfile', JSON.stringify(userData));

                // Set user data in AuthContext
                await login(userData);

                setAccount(walletAddress);
                navigate("/dashboard");
            } catch (error) {
                console.error(error);
                if (error.code === 4001) {
                    alert("You must approve MetaMask connection to continue.");
                } else {
                    alert("Failed to connect MetaMask. Please try again.\n" + error.message);
                }
            } finally {
                setIsLoading(false);
            }
        } else {
            alert("MetaMask not detected. Please install MetaMask.");
        }
    };

    const disconnectWallet = async () => {
        try {
            setAccount("");
            // Clear all localStorage data
            localStorage.clear();
            // Call logout from AuthContext to clear the auth state
            logout();
            alert("Wallet disconnected! Connect again to use the app.");
        } catch (error) {
            console.error("Error disconnecting wallet:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
            <div className="w-full max-w-md">
                <div className="glass-effect rounded-2xl border border-gray-700/50 p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold neon-text">Welcome Back</h1>
                        <p className="text-gray-400">Connect your wallet to continue</p>
                    </div>

                    <div className="space-y-4">
                        {account ? (
                            <div className="space-y-4">
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                    <p className="text-sm text-gray-400">Connected Account</p>
                                    <p className="text-sm font-medium text-gray-200 break-all">{account}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Connected with MetaMask
                                    </p>
                                </div>
                                <button
                                    onClick={disconnectWallet}
                                    className="w-full btn-secondary"
                                >
                                    Disconnect Wallet
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={connectMetaMask}
                                    disabled={isLoading}
                                    className="w-full btn-primary flex items-center justify-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                                            <span>Connect with MetaMask</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <p>Don't have a wallet? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Download MetaMask</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
