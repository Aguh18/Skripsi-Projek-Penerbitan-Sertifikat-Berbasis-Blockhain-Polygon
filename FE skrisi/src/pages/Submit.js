import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, isAddress, keccak256, parseUnits } from 'ethers';
import contractABI from '../ABI.json';
import { toast } from 'react-toastify';
import { NETWORKS, CONTRACTS, DEFAULT_NETWORK, APP_CONFIG } from '../config/network';

const contractAddress = CONTRACTS.certificateRegistry.address;
const networkConfig = NETWORKS[DEFAULT_NETWORK];

const Submit = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [transactionStatus, setTransactionStatus] = useState('');
    const [error, setError] = useState('');
    const [fileHash, setFileHash] = useState('-');
    const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

    const state = location.state;

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

    useEffect(() => {
        if (!state || !state.data) {
            navigate('/issue-certificate', { replace: true });
        }
    }, [state, navigate]);

    // Generate hash from local file (PDF) after mount
    useEffect(() => {
        if (!state || !state.data || !state.data.filePath) return;
        // Try to fetch the file as ArrayBuffer and hash it
        const fetchAndHash = async () => {
            try {
                const response = await fetch(state.data.filePath);
                const arrayBuffer = await response.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const hash = keccak256(uint8Array);
                setFileHash(hash);
            } catch (err) {
                setFileHash('-');
            }
        };
        fetchAndHash();
    }, [state]);

    if (!state || !state.data) {
        return null;
    }

    const data = state.data;
    console.log('Data from state:', data);

    const fileCid = data.fileCid || 'https://bafybeibgunsp4yfmxonp4vji3ntzpyis32wh33hucb6tsdg4xbogdniyyu.ipfs.w3s.link/certificate_Asep_Teguh_hidayat_2025-05-04T03-57-46-396Z.pdf';

    const certificateData = {
        id: data.hash || data.id || 'CERT123',
        certificateTitle: data.certificateTitle || 'Certificate of Achievement',
        expiryDate: data.expiryDate || '',
        issueDate: data.issueDate || '2025-05-16',
        cid: data.fileCid || 'QmT5NvUtoM5nXy6v7e4f3g3g3g3g3g3g3g3g3g3g3g3g3g',
        issuerName: data.issuerName || 'Universitas XYZ',
        recipientName: data.recipientName || 'Recipient Name',
        targetAddress: data.targetAddress || '0xFde6f7aC02514dDa4B3bB7C135EB0A39C90243A4',
    };

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
            const formattedCid = certificateData.cid.startsWith('0x') ? certificateData.cid : `0x${certificateData.cid}`;

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
                    navigate('/dashboard');
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
                <h1 className="text-3xl font-bold mb-8 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Detail Sertifikat</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Certificate Data Section */}
                    <div className="card space-y-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Data Sertifikat</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Judul</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 text-gray-300">
                                    {certificateData.certificateTitle}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="block text-sm font-medium text-gray-400 mb-1">CID File</label>
                                <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30 font-mono text-sm text-gray-300 break-all">
                                    {certificateData.cid}
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
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Pratinjau Sertifikat</h2>
                        <div className="relative w-full h-[calc(100vh-12rem)] rounded-lg overflow-hidden border border-gray-700/30">
                            <iframe
                                src={fileCid}
                                title="Certificate PDF"
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Submit;