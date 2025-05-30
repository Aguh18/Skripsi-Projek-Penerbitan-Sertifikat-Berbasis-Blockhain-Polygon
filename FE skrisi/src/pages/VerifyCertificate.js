
import { useState, useEffect } from 'react';
import { BrowserProvider, Contract, keccak256 } from 'ethers';
import { ethers } from 'ethers';
import contractABI from '../ABI.json';


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
      } else {
        setError('Certificate is invalid or does not exist.');
      }
    } catch (err) {
      setError('Failed to verify certificate.');
    } finally {
      setLoading(false);
    }
  };


  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
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
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Verify Certificate</h1>
      <div>

        <div>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ marginBottom: '20px' }}
          />

        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={certificateId}
          onChange={(e) => setCertificateId(e.target.value)}
          placeholder="Enter Certificate ID"
          style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
        />
      </div>
      <button
        onClick={handleVerify}
        disabled={!contract || loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: !contract || loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      {isValid !== null && (
        <div style={{ marginTop: '20px' }}>
          <h2>Result</h2>
          <p style={{ color: isValid ? 'green' : 'red' }}>
            {isValid ? 'Certificate is valid!' : 'Certificate is invalid.'}
          </p>
        </div>
      )}
      {certificateData && (
        <div style={{ marginTop: '20px' }}>
          <h2>Details</h2>
          <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
            {JSON.stringify(certificateData, null, 2)}
          </pre>
        </div>
      )}

      <h2>Certificate PDF</h2>
      <iframe
        src={certificateData?.cid}
        title="Certificate PDF"
        style={{ width: '100%', height: '80vh', border: 'none' }}
      />
    </div>
  );
};

export default VerifyCertificate;
