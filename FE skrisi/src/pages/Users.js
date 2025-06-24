import { useEffect, useState } from 'react';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import contractABI from '../ABI.json';
import { CONTRACTS } from '../config/network';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('issuer'); // 'issuer' | 'approval'
    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [approving, setApproving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getEnv('BASE_URL')}/api/account/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.data);
            } else {
                toast.error('Gagal mengambil data user');
            }
        } catch (err) {
            toast.error('Gagal mengambil data user');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${getEnv('BASE_URL')}/api/account/issuer-application`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(res.data.data.filter(app => app.status === 'PENDING'));
        } catch (err) {
            toast.error('Gagal mengambil data pengajuan');
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        if (tab === 'approval') fetchRequests();
    }, [tab]);

    // Pisahkan user berdasarkan role
    const issuers = users.filter(u => u.role === 'issuer' || u.role === 'admin');

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
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(CONTRACTS.certificateRegistry.address, contractABI, signer);
            const tx = await contract.addIssuer(walletAddress);
            toast.info('Menunggu konfirmasi blockchain...');
            await tx.wait();
            toast.success('Berhasil menambah issuer di blockchain!');
            const token = localStorage.getItem('token');
            await axios.post(`${getEnv('BASE_URL')}/api/account/issuer-application/approve`, { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Pengajuan disetujui dan user menjadi issuer!');
            fetchRequests();
            fetchUsers();
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
            <h1 className="text-3xl font-bold mb-8 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Manajemen User</h1>
            <div className="flex space-x-4 mb-8">
                <button className={`btn-secondary ${tab === 'issuer' ? 'bg-blue-700/30 border-blue-500/50 text-blue-300' : ''}`} onClick={() => setTab('issuer')}>Daftar Issuer</button>
                <button className={`btn-secondary ${tab === 'approval' ? 'bg-green-700/30 border-green-500/50 text-green-300' : ''}`} onClick={() => setTab('approval')}>Approval Issuer</button>
            </div>
            {tab === 'issuer' && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-blue-400">Daftar Issuer</h2>
                    <div className="card overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all duration-300">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700/30">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Wallet Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nama</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Daftar</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-900/30 divide-y divide-gray-700/30">
                                    {issuers.map((user) => (
                                        <tr key={user.walletAddress}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{user.walletAddress}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{user.name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{user.email || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 capitalize">{user.role}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {tab === 'approval' && (
                <div className="mb-12">
                    <h2 className="text-xl font-semibold mb-4 text-green-400">Approval Pengajuan Issuer</h2>
                    {loadingRequests ? (
                        <div className="flex items-center justify-center min-h-[200px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                    ) : (
                        <div className="card overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl hover:border-green-500/50 transition-all duration-300">
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
                    )}
                </div>
            )}
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

export default Users; 