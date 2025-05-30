import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, keccak256 } from 'ethers';
import { ethers } from 'ethers';
import contractABI from '../ABI.json';
import { toast } from 'react-toastify';

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const networkConfig = {
  chainId: '0x7a69',
  chainName: 'Hardhat Local',
  rpcUrls: ['http://127.0.0.1:8545/'],
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  blockExplorerUrls: [],
};

const VerifyCertificate = () => {
  const [contract, setContract] = useState(null);
  const [certificateId, setCertificateId] = useState('');
  const [certificateData, setCertificateData] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Function to format CID URL
  const formatCidUrl = (cid) => {
    if (!cid) return '';
    // Remove '0x' prefix if exists
    const cleanCid = cid.replace('0x', '');
    // Check if it's already a full URL
    if (cleanCid.startsWith('http')) return cleanCid;
    // Check if it's already a CID
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
        setError('MetaMask not detected.');
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
        setError('Failed to connect to MetaMask.');
      }
    };

    initEthers();
  }, []);

  const handleVerify = async () => {
    if (!contract || !certificateId.trim()) {
      setError('Please enter a valid Certificate ID.');
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
        setError('Certificate is invalid or does not exist.');
        toast.error('Sertifikat tidak valid atau tidak ditemukan.');
      }
    } catch (err) {
      setError('Failed to verify certificate.');
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
    // Reset file input if ID is manually entered
    if (selectedFile) {
      setSelectedFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-gradient">Verifikasi Sertifikat</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification Form Section */}
          <div className="card space-y-6">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Form Verifikasi</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Upload File Sertifikat
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-300"
                />
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
                  className="w-full p-3 bg-gray-800/50 border border-gray-700/30 rounded-lg text-gray-300 font-mono text-sm"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={!contract || loading}
                className="w-full btn-primary relative"
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
            </div>
          </div>

          {/* Certificate Details Section */}
          {certificateData && (
            <div className="card space-y-6">
              <h2 className="text-xl font-semibold text-gray-300 mb-4">Detail Sertifikat</h2>

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
              </div>
            </div>
          )}
        </div>

        {/* PDF Preview Section */}
        {certificateData && (
          <div className="card mt-6">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">Pratinjau Sertifikat</h2>
            <div className="relative w-full h-[calc(100vh-12rem)] rounded-lg overflow-hidden border border-gray-700/30">
              <iframe
                src={formatCidUrl(certificateData.cid)}
                title="Certificate PDF"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
