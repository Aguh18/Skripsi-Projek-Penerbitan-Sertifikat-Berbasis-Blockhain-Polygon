import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, isAddress } from 'ethers';
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

    const state = location.state;

    // Initialize ethers.js with MetaMask
    useEffect(() => {
        const initEthers = async () => {
            if (!window.ethereum) {
                toast.error('MetaMask not detected. Please install MetaMask.');
                return;
            }

            try {
                // Request account access first
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found');
                }

                // Get current chain ID
                const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
                console.log('Current chain ID:', currentChainId);
                console.log('Target chain ID:', networkConfig.chainId);

                // Switch network if needed
                if (currentChainId !== networkConfig.chainId) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: networkConfig.chainId }],
                        });
                    } catch (switchError) {
                        if (switchError.code === 4902) {
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [networkConfig],
                                });
                            } catch (addError) {
                                toast.error('Failed to add Hardhat network to MetaMask');
                                return;
                            }
                        } else {
                            toast.error('Failed to switch to Hardhat network');
                            return;
                        }
                    }
                }

                // Create provider and signer
                const web3Provider = new BrowserProvider(window.ethereum);
                const signer = await web3Provider.getSigner();
                const contractInstance = new Contract(contractAddress, contractABI, signer);

                setProvider(web3Provider);
                setSigner(signer);
                setContract(contractInstance);

                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length === 0) {
                        toast.error('Please connect your MetaMask wallet');
                    }
                });

                // Listen for chain changes
                window.ethereum.on('chainChanged', (chainId) => {
                    if (chainId !== networkConfig.chainId) {
                        toast.error('Please switch to Hardhat network');
                    }
                });

            } catch (err) {
                console.error('Error initializing ethers:', err);
                toast.error(`Failed to connect to MetaMask: ${err.message}`);
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

    if (!state || !state.data) {
        return null;
    }

    const data = state.data;
    console.log('Data from state:', data);

    const fileCid = data.fileCid || 'https://bafybeibgunsp4yfmxonp4vji3ntzpyis32wh33hucb6tsdg4xbogdniyyu.ipfs.w3s.link/certificate_Asep_Teguh_hidayat_2025-05-04T03-57-46-396Z.pdf';

    const certificateData = {
        id: data.id || 'CERT123',
        certificateTitle: data.certificateTitle || 'Certificate of Achievement',
        expiryDate: data.expiryDate || '',
        issueDate: data.issueDate || '2025-05-16',
        cid: data.fileCid || 'QmT5NvUtoM5nXy6v7e4f3g3g3g3g3g3g3g3g3g3g3g3g3g',
        issuerName: data.issuerName || 'Universitas XYZ',
        recipientName: data.recipientName || 'Recipient Name',
        targetAddress: data.targetAddress || '0xFde6f7aC02514dDa4B3bB7C135EB0A39C90243A4',
    };

    const handleIssueCertificate = async () => {
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
                certificateData.id,
                certificateData.certificateTitle,
                formattedExpiryDate,
                formattedIssueDate,
                formattedCid,
                certificateData.issuerName,
                certificateData.recipientName,
                certificateData.targetAddress,
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
        <div className="animate-fade-in">
            <div className="max-w-6xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-gradient">Detail Sertifikat</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Certificate Data Section */}
                    <div className="card space-y-6">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Data Sertifikat</h2>

                        <div className="space-y-4">
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
                        </div>

                        <div className="pt-4 border-t border-gray-700/30">
                            <button
                                onClick={handleIssueCertificate}
                                disabled={!contract || transactionStatus === 'Processing...'}
                                className="w-full btn-primary relative"
                            >
                                {transactionStatus === 'Processing...' ? (
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