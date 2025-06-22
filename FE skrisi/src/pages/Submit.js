import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, isAddress, keccak256, parseUnits } from 'ethers';
import contractABI from '../ABI.json';
import { toast } from 'react-toastify';
import { NETWORKS, CONTRACTS, DEFAULT_NETWORK, APP_CONFIG } from '../config/network';
import axios from 'axios';
import { getEnv } from '../utils/env';

const contractAddress = CONTRACTS.certificateRegistry.address;
const networkConfig = NETWORKS[DEFAULT_NETWORK];

const Submit = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [transactionStatus, setTransactionStatus] = useState('');
    const [error, setError] = useState('');
    const [fileHash, setFileHash] = useState('-');
    const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);
    const [certificateData, setCertificateData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch certificate data from backend
    useEffect(() => {
        const fetchCertificateData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Silakan login terlebih dahulu');
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`${getEnv('BASE_URL')}/api/certificate/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    const data = response.data.data;
                    setCertificateData({
                        id: data.id,
                        certificateTitle: data.certificateTitle || 'Certificate',
                        expiryDate: data.expiryDate || '',
                        issueDate: data.issueDate || new Date().toISOString(),
                        fileCid: data.ipfsCid || '',
                        filePath: data.filePath || '',
                        issuerName: data.issuerName || 'Issuer',
                        recipientName: data.recipientName || 'Recipient',
                        targetAddress: data.targetAddress || '',
                        hash: data.id
                    });
                } else {
                    toast.error('Sertifikat tidak ditemukan');
                    navigate('/dashboard/certificates');
                }
            } catch (error) {
                console.error('Error fetching certificate:', error);
                toast.error('Gagal mengambil data sertifikat');
                navigate('/dashboard/certificates');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCertificateData();
        } else {
            toast.error('ID sertifikat tidak ditemukan');
            navigate('/dashboard/certificates');
        }
    }, [id, navigate]);

    // Initialize ethers.js with MetaMask
    useEffect(() => {
        const initEthers = async () => {
            if (!window.ethereum) {
                toast.error('MetaMask tidak terdeteksi. Silakan install MetaMask.');
                return;
            }

            try {
                // Request account access first
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('Tidak ada akun yang ditemukan');
                }

                // Create provider and signer (tanpa cek chain/network)
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contractInstance = new Contract(contractAddress, contractABI, signer);

                setProvider(provider);
                setSigner(signer);
                setContract(contractInstance);
                setIsMetaMaskConnected(true);

                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        setIsMetaMaskConnected(false);
                        toast.error('Silakan hubungkan wallet MetaMask Anda');
                    } else {
                        setIsMetaMaskConnected(true);
                    }
                });

                // Listen for chain changes (tanpa auto switch)
                window.ethereum.on('chainChanged', async (chainId) => {
                    setIsMetaMaskConnected(true);
                    // Reinitialize contract with new chain
                    const newProvider = new BrowserProvider(window.ethereum);
                    const newSigner = await newProvider.getSigner();
                    const newContract = new Contract(contractAddress, contractABI, newSigner);
                    setContract(newContract);
                    setSigner(newSigner);
                });

            } catch (err) {
                console.error('Error initializing ethers:', err);
                toast.error(`Gagal terhubung ke MetaMask: ${err.message}`);
                setIsMetaMaskConnected(false);
            }
        };

        initEthers();

        // Cleanup listeners
        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, []);

    // Generate hash from file after certificate data is loaded
    useEffect(() => {
        if (!certificateData || !certificateData.filePath) return;

        const fetchAndHash = async () => {
            try {
                const response = await fetch(certificateData.filePath);
                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const hash = keccak256(uint8Array);
                setFileHash(hash);
            } catch (err) {
                console.error('Error generating file hash:', err);
                setFileHash('-');
            }
        };
        fetchAndHash();
    }, [certificateData]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Memuat data sertifikat...</div>
            </div>
        );
    }

    if (!certificateData) {
        return null;
    }

    const handleIssueCertificate = async () => {
        if (!window.ethereum) {
            toast.error('MetaMask tidak terdeteksi. Silakan install MetaMask.');
            return;
        }

        if (!isMetaMaskConnected) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) {
                    setIsMetaMaskConnected(true);
                    // Reinitialize contract with new signer
                    const web3Provider = new BrowserProvider(window.ethereum);
                    const signer = await web3Provider.getSigner();
                    const contractInstance = new Contract(contractAddress, contractABI, signer);
                    setContract(contractInstance);
                    setSigner(signer);
                }
            } catch (err) {
                toast.error('Gagal terhubung ke MetaMask');
                return;
            }
        }

        if (!contract || !signer) {
            toast.error('Contract atau signer belum diinisialisasi. Pastikan MetaMask terhubung.');
            return;
        }

        setTransactionStatus('Processing...');
        setError('');

        try {
            if (!certificateData.id || !certificateData.certificateTitle || !certificateData.recipientName) {
                throw new Error('Field wajib (ID, judul, nama penerima) tidak boleh kosong');
            }

            if (!isAddress(certificateData.targetAddress)) {
                throw new Error('Alamat target tidak valid');
            }

            // Format dates properly
            const formattedIssueDate = certificateData.issueDate ? new Date(certificateData.issueDate).toISOString().split('T')[0] : '';
            const formattedExpiryDate = certificateData.expiryDate ? new Date(certificateData.expiryDate).toISOString().split('T')[0] : '';

            // Ensure CID is properly formatted
            const formattedCid = certificateData.fileCid.startsWith('0x') ? certificateData.fileCid : `0x${certificateData.fileCid}`;

            console.log('Sending data to contract:', {
                id: certificateData.id,
                title: certificateData.certificateTitle,
                expiryDate: formattedExpiryDate,
                issueDate: formattedIssueDate,
                cid: formattedCid,
                issuer: certificateData.issuerName,
                recipient: certificateData.recipientName,
                targetAddress: certificateData.targetAddress
            });

            // Call the contract function
            const tx = await contract.issueCertificate(
                String(certificateData.id),
                String(certificateData.certificateTitle),
                String(formattedExpiryDate),
                String(formattedIssueDate),
                String(formattedCid),
                String(certificateData.issuerName),
                String(certificateData.recipientName),
                String(certificateData.targetAddress),
                { gasLimit: APP_CONFIG.maxGasLimit } // Use gas limit from config
            );

            // Show transaction pending toast
            const pendingToast = toast.info('Transaksi sedang diproses...', {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false,
            });

            try {
                // Wait for transaction to be mined
                const receipt = await tx.wait();
                console.log('Transaction receipt:', receipt);

                // Find the CertificateIssued event
                const log = receipt.logs.find((log) => {
                    try {
                        return contract.interface.parseLog(log).name === 'CertificateIssued';
                    } catch {
                        return false;
                    }
                });

                if (!log) {
                    throw new Error('Event CertificateIssued tidak ditemukan dalam receipt transaksi');
                }

                const decoded = contract.interface.parseLog(log);
                const issuedId = decoded.args.id;

                // Close the pending toast
                toast.dismiss(pendingToast);

                // Show success toast
                toast.success('Sertifikat berhasil diterbitkan ke blockchain!', {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });

                setTransactionStatus(`Sertifikat berhasil diterbitkan dengan ID: ${issuedId}`);

                // Wait for 3 seconds before navigating
                setTimeout(() => {
                    navigate('/dashboard/certificates');
                }, 3000);

            } catch (txError) {
                // Close the pending toast
                toast.dismiss(pendingToast);
                throw txError;
            }

        } catch (err) {
            console.error('Error issuing certificate:', err);
            toast.error(`Gagal menerbitkan sertifikat: ${err.message}`);
            setTransactionStatus('');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden relative animate-fade-in">
            {/* Space Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Stars */}
                <div className="absolute inset-0 bg-[radial-gradient(white,rgba(255,255,255,.2)_2px,transparent_40px)] bg-[length:50px_50px] opacity-20"></div>
                {/* Nebula Effects */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl mix-blend-screen"></div>
                <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl mix-blend-screen"></div>
            </div>
            <div className="max-w-6xl mx-auto p-6 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
                        Terbitkan Sertifikat ke Blockchain
                    </h1>
                    <p className="text-gray-400">Konfirmasi dan terbitkan sertifikat ke blockchain untuk keamanan dan transparansi</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Certificate Details */}
                    <div className="card bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Detail Sertifikat
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">ID Sertifikat</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300">
                                    {certificateData.id}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Judul Sertifikat</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                    {certificateData.certificateTitle}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Nama Penerima</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                        {certificateData.recipientName}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Nama Penerbit</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                        {certificateData.issuerName}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal Terbit</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                        {new Date(certificateData.issueDate).toLocaleDateString('id-ID')}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tanggal Kedaluwarsa</label>
                                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                        {certificateData.expiryDate ? new Date(certificateData.expiryDate).toLocaleDateString('id-ID') : 'Tidak ada'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Alamat Wallet Penerima</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                    {certificateData.targetAddress}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">IPFS CID</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                    {certificateData.fileCid}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Hash File (keccak256)</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                    {fileHash}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700/30">
                            <button
                                onClick={handleIssueCertificate}
                                disabled={!isMetaMaskConnected || transactionStatus === 'Processing...'}
                                className={`w-full btn-primary relative ${!isMetaMaskConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {!isMetaMaskConnected ? (
                                    'Hubungkan MetaMask'
                                ) : transactionStatus === 'Processing...' ? (
                                    <>
                                        <span className="opacity-0">Terbitkan ke Blockchain</span>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </>
                                ) : (
                                    'Terbitkan ke Blockchain'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* PDF Preview Section */}
                    <div className="card bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview Sertifikat
                        </h2>
                        <div className="bg-gray-900/50 rounded-lg border border-gray-700/30 overflow-hidden">
                            <iframe
                                src={certificateData.filePath}
                                className="w-full h-96"
                                title="Certificate Preview"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Submit;