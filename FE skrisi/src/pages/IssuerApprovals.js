import { useEffect, useState } from 'react';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import contractABI from '../ABI.json';
import { CONTRACTS } from '../config/network';
import { ethers } from 'ethers';

const contractAddress = CONTRACTS.certificateRegistry.address; // Untuk Polygon Mainnet, uncomment baris di bawah ini:
// const contractAddress = '0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D';

const IssuerApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getEnv('BASE_URL')}/api/account/issuer-application`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.data.filter(app => app.status === 'PENDING'));
        } catch (err) {
            toast.error('Gagal mengambil data pengajuan');
        } finally {
            setLoading(false);
        }
    };

    const handleDetail = (id) => {
        const req = requests.find(r => r.id === id);
        setSelected(req);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelected(null);
    };

    const handleApprove = async (id, walletAddress) => {
        if (!window.ethereum) {
            toast.error('MetaMask tidak terdeteksi. Silakan install MetaMask.');
            return;
        }
        setApproving(true);
        try {
            // 1. Connect to contract
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(contractAddress, contractABI, signer);
            const baseGasPrice = await signer.provider.getGasPrice();
            const extra = ethers.utils.parseUnits("0.25", "gwei");
            const gasPrice = baseGasPrice.add(extra);
            console.log('Base gas price:', baseGasPrice.toString(), 'Extra:', extra.toString(), 'Final gas price:', gasPrice.toString());
            // 2. Call addIssuer on contract
            const tx = await contract.addIssuer(walletAddress, { gasPrice });
            toast.info('Menunggu konfirmasi blockchain...');
            await tx.wait();
            toast.success('Berhasil menambah issuer di blockchain!');
            // 3. Call backend approve
            const token = localStorage.getItem('token');
            await axios.post(`${getEnv('BASE_URL')}/api/account/issuer-application/approve`, { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Pengajuan disetujui dan user menjadi issuer!');
            fetchRequests();
        } catch (err) {
            console.error(err);
            toast.error('Gagal approve: ' + (err?.message || 'Unknown error'));
        } finally {
            setApproving(false);
        }
    };

    const handleReject = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${getEnv('BASE_URL')}/api/account/issuer-application/reject`, { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Pengajuan ditolak');
            fetchRequests();
        } catch (err) {
            toast.error('Gagal menolak pengajuan');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 relative z-10">
            <h1 className="text-3xl font-bold mb-8 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Approval Pengajuan Issuer</h1>
            <div className="card overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/30">
                        <thead className="bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Wallet</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alasan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900/30 divide-y divide-gray-700/30">
                            {requests.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{req.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{req.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{req.userId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{req.reason}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{req.createdAt ? new Date(req.createdAt).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button onClick={() => handleDetail(req.id)} className="btn-secondary mr-2">Detail</button>
                                        <button onClick={() => handleApprove(req.id, req.userId)} className="btn-primary mr-2" disabled={approving}>Approve</button>
                                        <button onClick={() => handleReject(req.id)} className="btn-danger">Reject</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal Detail Pengajuan */}
            {showModal && selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
                    <div className="bg-gray-900 rounded-2xl shadow-xl p-8 max-w-md w-full relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4 text-blue-400">Detail Pengajuan Issuer</h2>
                        <div className="mb-2"><span className="font-semibold text-gray-300">Nama:</span> <span className="text-gray-200">{selected.name}</span></div>
                        <div className="mb-2"><span className="font-semibold text-gray-300">Email:</span> <span className="text-gray-200">{selected.email}</span></div>
                        <div className="mb-2"><span className="font-semibold text-gray-300">Wallet Address:</span> <span className="text-gray-200">{selected.userId}</span></div>
                        <div className="mb-2"><span className="font-semibold text-gray-300">Tanggal Pengajuan:</span> <span className="text-gray-200">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}</span></div>
                        <div className="mb-4"><span className="font-semibold text-gray-300">Alasan:</span>
                            <div className="bg-gray-800 rounded-lg p-3 mt-1 text-gray-100 whitespace-pre-line">{selected.reason}</div>
                        </div>
                        <button onClick={closeModal} className="btn-secondary w-full">Tutup</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssuerApprovals; 