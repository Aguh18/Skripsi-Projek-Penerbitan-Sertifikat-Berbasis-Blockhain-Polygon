import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContext } from 'react';
import { WalletContext } from '../context/WalletContext';

function Navbar() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const walletAddress = localStorage.getItem('walletAddress');
    const { isWalletConnected, isCorrectNetwork } = useContext(WalletContext);

    const handleLogout = () => {
        // Clear all localStorage data
        localStorage.clear();
        // Call logout from AuthContext to clear the auth state
        logout();
        // Close the profile dropdown
        setIsProfileOpen(false);
        // Navigate to login page
        navigate('/login');
    };

    const shortenAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <nav className="bg-gray-900/60 backdrop-blur-xl border-b border-blue-500/20 h-16 shadow-lg relative z-30">
            {/* Gradient/blur overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-2xl"></div>
            </div>
            <div className="container mx-auto px-4 h-full relative z-10">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">CertChain</span>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Network Status */}
                        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full border border-blue-500/20">
                            {isWalletConnected ? (
                                isCorrectNetwork ? (
                                    <>
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow"></div>
                                        <span className="text-sm text-blue-400">Connected to Polygon</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse-slow"></div>
                                        <span className="text-sm text-yellow-400">Wrong Network</span>
                                    </>
                                )
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-slow"></div>
                                    <span className="text-sm text-red-400">Not Connected</span>
                                </>
                            )}
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-700/30 transition-all duration-200 border border-blue-500/20 hover:border-blue-400/40 shadow"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
                                    <span className="text-blue-400 font-medium">
                                        {walletAddress ? walletAddress[2].toUpperCase() : '?'}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-gray-300 hidden md:block">
                                    {shortenAddress(walletAddress)}
                                </span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-48 glass-effect rounded-lg border border-blue-500/20 py-1 z-50 bg-gray-900/80 shadow-xl backdrop-blur-xl">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-blue-700/30 transition-colors duration-200 rounded"
                                    >
                                        Disconnect Wallet
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;