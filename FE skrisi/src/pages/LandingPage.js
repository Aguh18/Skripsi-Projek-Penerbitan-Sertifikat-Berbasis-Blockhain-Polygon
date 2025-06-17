import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BrowserProvider, Contract, keccak256 } from 'ethers';
import contractABI from '../ABI.json';
import { FiCheckCircle, FiShield, FiFileText, FiUsers, FiLock, FiGlobe, FiClock, FiAward, FiTrendingUp, FiDatabase, FiArrowDown } from 'react-icons/fi';

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const networkConfig = {
    chainId: '0x7a69',
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545/'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: [],
};

const LandingPage = () => {
    const [contract, setContract] = useState(null);
    const [certificateId, setCertificateId] = useState('');
    const [certificateData, setCertificateData] = useState(null);
    const [isValid, setIsValid] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeSection, setActiveSection] = useState('hero');

    // Add mouse move effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [scrollPosition, setScrollPosition] = useState(0);
    const [scrollDirection, setScrollDirection] = useState('down');
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: e.clientX,
                y: e.clientY
            });
        };

        const handleScroll = () => {
            const sections = ['hero', 'features', 'benefits', 'how-it-works', 'verification', 'cta'];
            const scrollPosition = window.scrollY + window.innerHeight / 3;

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { top, bottom } = element.getBoundingClientRect();
                    const offsetTop = top + window.scrollY;
                    const offsetBottom = bottom + window.scrollY;

                    if (scrollPosition >= offsetTop && scrollPosition <= offsetBottom) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Calculate parallax effect
    const calculateParallax = (base, factor) => {
        const x = (mousePosition.x - window.innerWidth / 2) * factor;
        const y = (mousePosition.y - window.innerHeight / 2) * factor;
        return {
            x,
            y
        };
    };

    // Calculate scroll parallax with enhanced effects
    const calculateScrollParallax = (base, factor) => {
        const y = scrollPosition * factor;
        const scale = 1 + (scrollPosition * 0.0001);
        const opacity = 1 - (scrollPosition * 0.0005);
        return {
            transform: `translateY(${y}px) scale(${scale})`,
            opacity: Math.max(opacity, 0.5)
        };
    };

    // Calculate scroll reveal
    const calculateScrollReveal = (elementPosition) => {
        const revealPoint = 150;
        const windowHeight = window.innerHeight;
        const revealTop = elementPosition.getBoundingClientRect().top;
        const revealBottom = elementPosition.getBoundingClientRect().bottom;

        if (revealTop < windowHeight - revealPoint && revealBottom > revealPoint) {
            return true;
        }
        return false;
    };

    // Function to format CID URL
    const formatCidUrl = (cid) => {
        if (!cid) return '';
        const cleanCid = cid.replace('0x', '');
        if (cleanCid.startsWith('http')) return cleanCid;
        if (cleanCid.startsWith('Qm') || cleanCid.startsWith('bafy')) {
            return `https://ipfs.io/ipfs/${cleanCid}`;
        }
        return '';
    };

    // Function to reset verification state
    const resetVerification = () => {
        setCertificateData(null);
        setIsValid(null);
        setError('');
    };

    useEffect(() => {
        const initEthers = async () => {
            if (!window.ethereum) {
                setError('MetaMask tidak terdeteksi.');
                return;
            }

            try {
                const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (currentChainId !== networkConfig.chainId) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: networkConfig.chainId }],
                        });
                    } catch (switchError) {
                        if (switchError.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [networkConfig],
                            });
                        } else {
                            throw switchError;
                        }
                    }
                }

                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                setContract(new Contract(contractAddress, contractABI, signer));
            } catch (err) {
                setError('Gagal terhubung ke MetaMask.');
            }
        };

        initEthers();
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!contract || !certificateId.trim()) {
            setError('Mohon masukkan ID Sertifikat yang valid.');
            return;
        }

        setLoading(true);
        setError('');
        setCertificateData(null);
        setIsValid(null);

        try {
            const isValidResult = await contract.verifyCertificate(certificateId);
            setIsValid(isValidResult);

            if (isValidResult) {
                const certData = await contract.getCertificate(certificateId);
                setCertificateData({
                    id: certData[0],
                    certificateTitle: certData[1],
                    cid: certData[2],
                    expiryDate: certData[3],
                    issueDate: certData[4],
                    issuerAddress: certData[5],
                    issuerName: certData[6],
                    recipientName: certData[7],
                    targetAddress: certData[8],
                    isValid: certData[9],
                });
                toast.success('Sertifikat valid!');
            } else {
                setError('Sertifikat tidak valid atau tidak ditemukan.');
                toast.error('Sertifikat tidak valid atau tidak ditemukan.');
            }
        } catch (err) {
            setError('Gagal memverifikasi sertifikat.');
            toast.error('Gagal memverifikasi sertifikat.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            resetVerification();
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    const uint8Array = new Uint8Array(arrayBuffer);
                    const hashHex = keccak256(uint8Array);
                    setCertificateId(hashHex);
                    console.log('Keccak256 Hash:', hashHex);
                } catch (error) {
                    console.error('Error computing hash:', error);
                    toast.error('Gagal menghitung hash file.');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setSelectedFile(null);
            setCertificateId('');
            resetVerification();
        }
    };

    const handleCertificateIdChange = (e) => {
        setCertificateId(e.target.value);
        resetVerification();
        if (selectedFile) {
            setSelectedFile(null);
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden relative">
            {/* Space Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Stars with scroll effect */}
                <div
                    className="absolute inset-0 bg-[radial-gradient(white,rgba(255,255,255,.2)_2px,transparent_40px)] bg-[length:50px_50px] opacity-20"
                    style={{ transform: `translateY(${scrollPosition * 0.5}px)` }}
                ></div>

                {/* Nebula Effects with scroll */}
                <div
                    className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl mix-blend-screen"
                    style={{
                        transform: `translate(${calculateParallax(0, 0.02).x}px, ${calculateParallax(0, 0.02).y + scrollPosition * 0.3}px)`,
                        opacity: 1 - (scrollPosition * 0.001)
                    }}
                ></div>
                <div
                    className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl mix-blend-screen"
                    style={{
                        transform: `translate(${calculateParallax(0, 0.03).x}px, ${calculateParallax(0, 0.03).y + scrollPosition * 0.2}px)`,
                        opacity: 1 - (scrollPosition * 0.0008)
                    }}
                ></div>

                {/* Space Dust with scroll */}
                <div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30"
                    style={{ transform: `translateY(${scrollPosition * 0.7}px)` }}
                ></div>
            </div>

            {/* Scroll Indicator */}
            <div
                className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 transition-all duration-300 ${scrollPosition > 100 ? 'opacity-0' : 'opacity-100'
                    }`}
            >
                <div className="flex flex-col items-center">
                    <span className="text-sm mb-2">Scroll untuk menjelajahi</span>
                    <FiArrowDown className={`w-6 h-6 animate-bounce ${isScrolling ? 'animate-none' : ''}`} />
                </div>
            </div>

            {/* Hero Section with enhanced scroll effects */}
            <div
                id="hero"
                className={`relative overflow-hidden transition-all duration-700 ${activeSection === 'hero'
                    ? 'opacity-100 scale-100 translate-z-0'
                    : 'opacity-40 scale-95 -translate-z-10'
                    }`}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent"
                    style={{ opacity: 1 - (scrollPosition * 0.002) }}
                ></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative"
                    style={calculateScrollParallax(0, 0.01)}
                >
                    <div className="text-center">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 relative">
                            <span className="relative inline-block">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
                                    Skripsweet
                                </span>
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            </span>
                        </h1>
                        <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
                            style={{ transform: calculateParallax(0, 0.005) }}>
                            Platform terdesentralisasi untuk penerbitan dan verifikasi sertifikat berbasis blockchain yang aman, transparan, dan terpercaya
                        </p>
                        <div className="flex justify-center space-x-4"
                            style={{ transform: calculateParallax(0, 0.015) }}>
                            <Link
                                to="/login"
                                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center space-x-2 text-lg overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative z-10 flex items-center">
                                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Login dengan MetaMask
                                </span>
                            </Link>
                            <a
                                href="#verification"
                                className="group relative bg-gray-800/50 backdrop-blur-sm text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center space-x-2 text-lg overflow-hidden hover:bg-gray-700/50 hover:shadow-lg hover:shadow-purple-500/25"
                            >
                                <span className="relative z-10 flex items-center">
                                    <FiCheckCircle className="w-6 h-6 mr-2" />
                                    Verifikasi Sertifikat
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section with scroll reveal */}
            <div
                id="features"
                className={`py-24 relative transition-all duration-700 ${activeSection === 'features'
                    ? 'opacity-100 scale-100 translate-z-0'
                    : 'opacity-40 scale-95 -translate-z-10'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-20 transition-all duration-700"
                        style={calculateScrollParallax(0, 0.01)}
                    >
                        <h2 className="text-4xl font-bold text-white mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Fitur Utama
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">Solusi terpercaya untuk manajemen sertifikat digital dengan teknologi blockchain</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <FiShield className="w-14 h-14 text-blue-400 mb-6" />,
                                title: "Keamanan Blockchain",
                                description: "Sertifikat disimpan secara aman di blockchain untuk mencegah pemalsuan dan memastikan keaslian dokumen"
                            },
                            {
                                icon: <FiFileText className="w-14 h-14 text-purple-400 mb-6" />,
                                title: "Verifikasi Instan",
                                description: "Verifikasi keaslian sertifikat dengan cepat dan mudah menggunakan teknologi blockchain"
                            },
                            {
                                icon: <FiUsers className="w-14 h-14 text-pink-400 mb-6" />,
                                title: "Kolaborasi",
                                description: "Platform kolaboratif untuk penerbit dan verifikator dengan sistem yang terdesentralisasi"
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-gray-800/30 backdrop-blur-sm p-8 rounded-lg border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
                                style={{
                                    ...calculateScrollParallax(0, 0.02 + index * 0.01),
                                    transform: `translateY(${scrollPosition * (0.1 + index * 0.05)}px) scale(${1 - (scrollPosition * 0.0001)})`
                                }}
                            >
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative">
                                        {feature.icon}
                                        <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Benefits Section with scroll effects */}
            <div
                id="benefits"
                className={`py-24 relative transition-all duration-700 ${activeSection === 'benefits'
                    ? 'opacity-100 scale-100 translate-z-0'
                    : 'opacity-40 scale-95 -translate-z-10'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-20 transition-all duration-700"
                        style={calculateScrollParallax(0, 0.01)}
                    >
                        <h2 className="text-4xl font-bold text-white mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Keuntungan Menggunakan Skripsweet
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">Temukan berbagai keuntungan menggunakan platform kami</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <FiLock className="w-12 h-12 text-blue-400 mb-4" />,
                                title: "Keamanan Tingkat Tinggi",
                                description: "Sertifikat dilindungi dengan teknologi blockchain yang tidak dapat dimanipulasi"
                            },
                            {
                                icon: <FiGlobe className="w-12 h-12 text-purple-400 mb-4" />,
                                title: "Akses Global",
                                description: "Verifikasi sertifikat dapat dilakukan dari mana saja di seluruh dunia"
                            },
                            {
                                icon: <FiClock className="w-12 h-12 text-pink-400 mb-4" />,
                                title: "Verifikasi Cepat",
                                description: "Proses verifikasi yang instan tanpa perlu menunggu waktu lama"
                            },
                            {
                                icon: <FiAward className="w-12 h-12 text-blue-400 mb-4" />,
                                title: "Terpercaya",
                                description: "Sistem yang terdesentralisasi menjamin keaslian dan kepercayaan"
                            },
                            {
                                icon: <FiTrendingUp className="w-12 h-12 text-purple-400 mb-4" />,
                                title: "Efisiensi",
                                description: "Mengurangi biaya dan waktu dalam proses verifikasi sertifikat"
                            },
                            {
                                icon: <FiDatabase className="w-12 h-12 text-pink-400 mb-4" />,
                                title: "Penyimpanan Permanen",
                                description: "Data sertifikat tersimpan secara permanen di blockchain"
                            }
                        ].map((benefit, index) => (
                            <div
                                key={index}
                                className="group bg-gray-800/30 backdrop-blur-sm p-8 rounded-lg hover:bg-gray-800/50 transition-all duration-300"
                                style={{
                                    ...calculateScrollParallax(0, 0.015 + index * 0.005),
                                    transform: `translateY(${scrollPosition * (0.15 + index * 0.03)}px) scale(${1 - (scrollPosition * 0.0001)})`
                                }}
                            >
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative">
                                        {benefit.icon}
                                        <h3 className="text-xl font-semibold text-white mb-3">{benefit.title}</h3>
                                        <p className="text-gray-400">{benefit.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* How It Works Section with scroll effects */}
            <div
                id="how-it-works"
                className={`py-24 relative transition-all duration-700 ${activeSection === 'how-it-works'
                    ? 'opacity-100 scale-100 translate-z-0'
                    : 'opacity-40 scale-95 -translate-z-10'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-20 transition-all duration-700"
                        style={calculateScrollParallax(0, 0.01)}
                    >
                        <h2 className="text-4xl font-bold text-white mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Cara Kerja
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto">Proses sederhana untuk penerbitan dan verifikasi sertifikat</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                number: "01",
                                title: "Penerbitan Sertifikat",
                                description: "Penerbit mengunggah sertifikat dan menyimpannya di blockchain dengan aman"
                            },
                            {
                                number: "02",
                                title: "Verifikasi",
                                description: "Verifikator dapat memeriksa keaslian sertifikat melalui platform kami"
                            },
                            {
                                number: "03",
                                title: "Hasil",
                                description: "Dapatkan hasil verifikasi instan dengan detail lengkap sertifikat"
                            }
                        ].map((step, index) => (
                            <div
                                key={index}
                                className="group bg-gray-800/30 backdrop-blur-sm p-8 rounded-lg border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300"
                                style={{
                                    ...calculateScrollParallax(0, 0.02 + index * 0.01),
                                    transform: `translateY(${scrollPosition * (0.2 + index * 0.05)}px) scale(${1 - (scrollPosition * 0.0001)})`
                                }}
                            >
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                    <div className="relative">
                                        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4">{step.number}</div>
                                        <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Verification Section with scroll effects */}
            <div
                id="verification"
                className={`py-24 relative transition-all duration-700 ${activeSection === 'verification'
                    ? 'opacity-100 scale-100 translate-z-0'
                    : 'opacity-40 scale-95 -translate-z-10'
                    }`}
            >
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="text-center mb-16 transition-all duration-700"
                        style={calculateScrollParallax(0, 0.01)}
                    >
                        <h2 className="text-4xl font-bold text-white mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Verifikasi Sertifikat
                            </span>
                        </h2>
                        <p className="text-xl text-gray-400">Verifikasi keaslian sertifikat Anda dengan mudah dan cepat</p>
                    </div>

                    <div
                        className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-8 border border-gray-700/30 hover:border-blue-500/50 transition-all duration-300"
                        style={{
                            ...calculateScrollParallax(0, 0.02),
                            transform: `translateY(${scrollPosition * 0.25}px) scale(${1 - (scrollPosition * 0.0001)})`
                        }}
                    >
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Upload File Sertifikat
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="w-full p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">Upload file PDF sertifikat untuk verifikasi otomatis</p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-700/30"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-900 text-gray-400">atau</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    ID Sertifikat
                                </label>
                                <input
                                    type="text"
                                    value={certificateId}
                                    onChange={handleCertificateIdChange}
                                    placeholder="Masukkan ID Sertifikat"
                                    className="w-full p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                />
                                <p className="mt-2 text-sm text-gray-500">Masukkan ID sertifikat untuk verifikasi manual</p>
                            </div>

                            <button
                                type="submit"
                                disabled={!contract || loading || (!certificateId && !selectedFile)}
                                className={`w-full btn-primary relative transition-all ${(!contract || loading || (!certificateId && !selectedFile))
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-blue-600'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <span className="opacity-0">Verifikasi</span>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </>
                                ) : (
                                    'Verifikasi'
                                )}
                            </button>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                        </form>

                        {certificateData && (
                            <div className="mt-8 space-y-4">
                                <h2 className="text-xl font-semibold text-white mb-4">Detail Sertifikat</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">ID Sertifikat</label>
                                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                            {certificateData.id}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Judul</label>
                                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                            {certificateData.certificateTitle}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal Terbit</label>
                                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                            {certificateData.issueDate}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal Kedaluwarsa</label>
                                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                            {certificateData.expiryDate || 'Tidak ada'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Penerbit</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                        {certificateData.issuerName}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Alamat Penerbit</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                        {certificateData.issuerAddress}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Penerima</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                        {certificateData.recipientName}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Alamat Target</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                        {certificateData.targetAddress}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                                    <div className={`p-3 rounded-lg border ${certificateData.isValid
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {certificateData.isValid ? 'Valid' : 'Tidak Valid'}
                                    </div>
                                </div>

                                {/* PDF Preview Section */}
                                <div className="mt-6">
                                    <h2 className="text-xl font-semibold text-gray-300 mb-4">Pratinjau Sertifikat</h2>
                                    <div className="relative w-full h-[calc(100vh-12rem)] rounded-lg overflow-hidden border border-gray-700/30">
                                        <iframe
                                            src={formatCidUrl(certificateData.cid)}
                                            title="Certificate PDF"
                                            className="absolute inset-0 w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CTA Section with scroll effects */}
            <div
                id="cta"
                className={`py-24 relative transition-all duration-700 ${activeSection === 'cta'
                    ? 'opacity-100 scale-100 translate-z-0'
                    : 'opacity-40 scale-95 -translate-z-10'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-8">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            Siap Memulai?
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                        Bergabunglah dengan platform kami untuk pengelolaan sertifikat yang lebih aman dan efisien
                    </p>
                    <Link
                        to="/login"
                        className="group relative inline-flex items-center px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Login dengan MetaMask
                        </span>
                    </Link>
                </div>
            </div>

            {/* Footer with scroll effects */}
            <footer className="bg-gray-900/50 backdrop-blur-sm py-12 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Skripsweet</h3>
                            <p className="text-gray-400">Platform terdesentralisasi untuk penerbitan dan verifikasi sertifikat berbasis blockchain</p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Fitur</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Verifikasi Sertifikat</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Penerbitan Sertifikat</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Manajemen Sertifikat</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Tautan</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tentang Kami</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Bantuan</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kontak</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Kontak</h4>
                            <ul className="space-y-2">
                                <li className="text-gray-400">Email: info@skripsweet.com</li>
                                <li className="text-gray-400">Telepon: +62 123 4567 890</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8">
                        <div className="text-center text-gray-400">
                            <p>&copy; 2024 Skripsweet. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 