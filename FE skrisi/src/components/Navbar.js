import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar() {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const walletAddress = localStorage.getItem('walletAddress');

    const handleLogout = () => {
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const shortenAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50 h-16">
            <div className="container mx-auto px-4 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <span className="text-xl font-semibold neon-text">CertChain</span>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Network Status */}
                        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse-slow"></div>
                            <span className="text-sm text-blue-400">Connected to Testnet</span>
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 border border-gray-700/50 hover:border-gray-600/50"
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
                                <div className="absolute right-0 mt-2 w-48 glass-effect rounded-lg border border-gray-700/50 py-1 z-50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800/50 transition-colors duration-200"
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