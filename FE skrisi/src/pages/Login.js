import { useState, useEffect } from "react";
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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const navigate = useNavigate();
    const { login, logout } = useAuth();

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const calculateParallax = (base, factor) => {
        const x = (mousePosition.x - window.innerWidth / 2) * factor;
        const y = (mousePosition.y - window.innerHeight / 2) * factor;
        return {
            x,
            y
        };
    };

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 relative overflow-hidden">
            {/* Space Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Stars */}
                <div className="absolute inset-0 bg-[radial-gradient(white,rgba(255,255,255,.2)_2px,transparent_40px)] bg-[length:50px_50px] opacity-20"></div>

                {/* Nebula Effects */}
                <div
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl mix-blend-screen"
                    style={{
                        transform: `translate(${calculateParallax(0, 0.02).x}px, ${calculateParallax(0, 0.02).y}px)`
                    }}
                ></div>
                <div
                    className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl mix-blend-screen"
                    style={{
                        transform: `translate(${calculateParallax(0, 0.03).x}px, ${calculateParallax(0, 0.03).y}px)`
                    }}
                ></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-8 space-y-6 hover:border-blue-500/50 transition-all duration-300">
                    <div className="text-center space-y-2">
                        <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Welcome Back
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg">Connect your wallet to continue</p>
                    </div>

                    <div className="space-y-4">
                        {account ? (
                            <div className="space-y-4">
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300">
                                    <p className="text-sm text-gray-400">Connected Account</p>
                                    <p className="text-sm font-medium text-gray-200 break-all">{account}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Connected with MetaMask
                                    </p>
                                </div>
                                <button
                                    onClick={disconnectWallet}
                                    className="w-full group relative bg-gray-800/50 backdrop-blur-sm text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-gray-700/50 hover:shadow-lg hover:shadow-purple-500/25"
                                >
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                    <span className="relative z-10">Disconnect Wallet</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={connectMetaMask}
                                    disabled={isLoading}
                                    className="w-full group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="relative z-10">Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5 relative z-10" />
                                            <span className="relative z-10">Connect with MetaMask</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-center text-sm text-gray-500">
                        <p>Don't have a wallet? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Download MetaMask</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
