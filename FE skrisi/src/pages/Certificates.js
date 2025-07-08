import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText, FiCopy } from 'react-icons/fi';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import contractABI from '../ABI.json';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACTS } from '../config/network';
import { parseUnits } from 'ethers';

const contractAddress = CONTRACTS.certificateRegistry.address; // Untuk Polygon Mainnet, uncomment baris di bawah ini:
// const contractAddress = '0xB527B1ED788e26639Fdd5E4E9b9dD200eD4E7F9D';

const Certificates = () => {
    const { isIssuer, isVerifier } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(isVerifier() ? 'received' : 'issued');
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [receivedCertificates, setReceivedCertificates] = useState([]);
    const [draftCertificates, setDraftCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingDraft, setLoadingDraft] = useState(false);
    const [selectedDrafts, setSelectedDrafts] = useState([]);
    const [bulkPublishing, setBulkPublishing] = useState(false);

    useEffect(() => {
        if (activeTab === 'draft') {
            fetchDraftCertificates();
        } else {
            fetchCertificates();
        }
    }, [activeTab]);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Silakan login terlebih dahulu');
                return;
            }

            const endpoint = activeTab === 'issued'
                ? `${getEnv('BASE_URL')}/api/certificate/by-issuer`
                : `${getEnv('BASE_URL')}/api/certificate/by-target`;

            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                if (activeTab === 'issued') {
                    setIssuedCertificates(response.data.data);
                } else {
                    setReceivedCertificates(response.data.data);
                }
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
            toast.error('Gagal mengambil data sertifikat');
        } finally {
            setLoading(false);
        }
    };

    const fetchDraftCertificates = async () => {
        try {
            setLoadingDraft(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Silakan login terlebih dahulu');
                return;
            }
            const response = await axios.get(`${getEnv('BASE_URL')}/api/certificate/drafts`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                setDraftCertificates(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching draft certificates:', error);
            toast.error('Gagal mengambil data sertifikat draft');
        } finally {
            setLoadingDraft(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            ACTIVE: {
                color: 'bg-green-500/10 text-green-400 border-green-500/20',
                icon: <FiCheckCircle className="w-4 h-4" />
            },
            EXPIRED: {
                color: 'bg-red-500/10 text-red-400 border-red-500/20',
                icon: <FiXCircle className="w-4 h-4" />
            }
        };

        const config = statusConfig[status] || statusConfig.ACTIVE;

        return (
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                {config.icon}
                <span className="ml-1.5 capitalize">{status.toLowerCase()}</span>
            </div>
        );
    };

    const handleDownload = async (certificate) => {
        try {
            const response = await axios.get(certificate.filePath, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `certificate-${certificate.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading certificate:', error);
            toast.error('Gagal mengunduh sertifikat');
        }
    };

    const handleView = (certificate) => {
        window.open(certificate.filePath, '_blank');
    };

    const handlePublishCertificate = (cert) => {
        // Navigate to submit page with certificate ID in URL
        navigate(`/dashboard/issue-certificate/submit/${cert.id}`);
    };

    // Helper to group certificates by template name
    const groupByTemplate = (certs) => {
        const groups = {};
        certs.forEach(cert => {
            const template = cert.certificateTitle || 'Tanpa Template';
            if (!groups[template]) groups[template] = [];
            groups[template].push(cert);
        });
        return groups;
    };

    // Helper: get all draft certificate IDs
    const allDraftIds = draftCertificates.flatMap(group => group.certificates.map(cert => cert.id));
    const isAllSelected = allDraftIds.length > 0 && allDraftIds.every(id => selectedDrafts.includes(id));

    const handleSelectDraft = (id) => {
        setSelectedDrafts((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };
    const handleSelectAllDrafts = () => {
        if (isAllSelected) setSelectedDrafts([]);
        else setSelectedDrafts(allDraftIds);
    };

    // Bulk publish handler
    const handleBulkPublish = async () => {
        if (selectedDrafts.length === 0) return;
        setBulkPublishing(true);
        try {
            // 1. Ambil data semua sertifikat draft yang dipilih
            const token = localStorage.getItem('token');
            const certs = [];
            for (const id of selectedDrafts) {
                const res = await axios.get(`${getEnv('BASE_URL')}/api/certificate/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                certs.push(res.data.data);
            }
            // 2. Siapkan array untuk parameter bulk
            const ids = certs.map(c => c.id);
            const titles = certs.map(c => c.certificateTitle);
            const expiryDates = certs.map(c => c.expiryDate || '');
            const issueDates = certs.map(c => c.issueDate || '');
            const cids = certs.map(c => c.ipfsCid);
            const issuerNames = certs.map(c => c.issuerName);
            const recipientNames = certs.map(c => c.recipientName);
            const targetAddresses = certs.map(c => c.targetAddress);
            // 3. Panggil contract bulk
            if (!window.ethereum) throw new Error('MetaMask tidak terdeteksi');
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(contractAddress, contractABI, signer);
            const baseGasPrice = await signer.provider.getGasPrice();
            const extra = parseUnits("0.25", "gwei");
            const gasPrice = baseGasPrice.add(extra);
            console.log('Base gas price:', baseGasPrice.toString(), 'Extra:', extra.toString(), 'Final gas price:', gasPrice.toString());
            const tx = await contract.issueCertificatesBulk(
                ids, titles, expiryDates, issueDates, cids, issuerNames, recipientNames, targetAddresses,
                { gasLimit: 5000000, gasPrice }
            );
            await tx.wait();
            // Update status di backend
            await axios.post(
                `${getEnv('BASE_URL')}/api/certificate/set-status`,
                { ids, status: 'ACTIVE' },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            toast.success('Bulk terbitkan ke blockchain & update status sukses!');
            setSelectedDrafts([]);
        } catch (err) {
            toast.error('Bulk terbitkan gagal! ' + (err?.message || ''));
        }
        setBulkPublishing(false);
    };

    // Copy to clipboard helper
    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id);
        toast.success('ID berhasil disalin!');
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
            <div className="max-w-7xl mx-auto p-6 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold mb-8 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Sertifikat</h1>
                    {isIssuer() && (
                        <Link
                            to="/dashboard/issue-certificate"
                            className="btn-primary inline-flex items-center group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                        >
                            <FiPlus className="w-5 h-5 mr-2" />
                            Terbitkan Sertifikat
                        </Link>
                    )}
                </div>
                <div className="mb-6">
                    <div className="border-b border-blue-700/30">
                        <nav className="-mb-px flex space-x-8">
                            {isIssuer() && (
                                <button
                                    onClick={() => setActiveTab('issued')}
                                    className={`${activeTab === 'issued'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-blue-400'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Sertifikat yang Diterbitkan
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('received')}
                                className={`${activeTab === 'received'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-blue-400'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Sertifikat yang Diterima
                            </button>
                            {isIssuer() && (
                                <button
                                    onClick={() => setActiveTab('draft')}
                                    className={`${activeTab === 'draft'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-blue-400'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Sertifikat Draft
                                </button>
                            )}
                        </nav>
                    </div>
                </div>
                {activeTab === 'draft' ? (
                    <div>
                        {loadingDraft ? (
                            <div className="card bg-gray-800/30 p-8 text-center text-gray-400">Memuat data draft...</div>
                        ) : draftCertificates.length === 0 ? (
                            <div className="card bg-gray-800/30 p-8 text-center text-gray-400">Belum ada sertifikat draft</div>
                        ) : (
                            <>
                                <div className="flex justify-end mb-4">
                                    <button
                                        className="btn-primary px-6 py-2 rounded-lg"
                                        disabled={selectedDrafts.length === 0 || bulkPublishing}
                                        onClick={handleBulkPublish}
                                    >
                                        {bulkPublishing ? 'Menerbitkan...' : `Bulk Terbitkan (${selectedDrafts.length})`}
                                    </button>
                                </div>
                                {draftCertificates.map((group) => (
                                    <div key={group.template.id} className="mb-8">
                                        <h2 className="text-lg font-bold text-blue-400 mb-2">{group.template.name}</h2>
                                        <div className="card overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all duration-300">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-700/30">
                                                    <thead className="bg-gray-800/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAllSelected}
                                                                    onChange={handleSelectAllDrafts}
                                                                />
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID Sertifikat</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Penerima</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Dibuat</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700/30">
                                                        {group.certificates.map((cert) => (
                                                            <tr key={cert.id} className="hover:bg-blue-900/20 transition-colors">
                                                                <td className="px-4 py-4 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedDrafts.includes(cert.id)}
                                                                        onChange={() => handleSelectDraft(cert.id)}
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 flex items-center gap-2">
                                                                    {cert.id.substring(0, 10)}...
                                                                    <button onClick={() => handleCopyId(cert.id)} className="ml-2 text-gray-400 hover:text-blue-400" title="Copy ID">
                                                                        <FiCopy className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                                    <div className="font-medium">{cert.recipient?.name || '-'}</div>
                                                                    <div className="text-xs text-gray-400">{cert.recipient?.walletAddress || '-'}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(cert.createdAt).toLocaleDateString('id-ID')}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                    <Link
                                                                        to={`/certificates/${cert.id}`}
                                                                        className="text-blue-400 hover:text-blue-600 mr-4"
                                                                    >
                                                                        Lihat
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => handlePublishCertificate(cert)}
                                                                        className="text-green-400 hover:text-green-600"
                                                                    >
                                                                        Terbitkan
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                ) : (
                    <div>
                        {loading ? (
                            <div className="card bg-gray-800/30 p-8 text-center text-gray-400">Memuat data...</div>
                        ) : (activeTab === 'issued' ? issuedCertificates : receivedCertificates).length === 0 ? (
                            <div className="card bg-gray-800/30 p-8 text-center text-gray-400">Tidak ada sertifikat</div>
                        ) : activeTab === 'issued' ? (
                            Object.entries(groupByTemplate(issuedCertificates)).map(([template, certs]) => (
                                <div key={template} className="mb-8">
                                    <h2 className="text-lg font-bold text-blue-400 mb-2">{template}</h2>
                                    <div className="card overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all duration-300">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-700/30">
                                                <thead className="bg-gray-800/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID Sertifikat</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Penerima</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Judul</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Terbit</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Kedaluwarsa</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-700/30">
                                                    {certs.map((cert) => (
                                                        <tr key={cert.id} className="hover:bg-blue-900/20 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 flex items-center gap-2">
                                                                {cert.id.substring(0, 10)}...
                                                                <button onClick={() => handleCopyId(cert.id)} className="ml-2 text-gray-400 hover:text-blue-400" title="Copy ID">
                                                                    <FiCopy className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cert.recipientName}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cert.certificateTitle}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(cert.issueDate).toLocaleDateString('id-ID')}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('id-ID') : '-'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(cert.status)}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <div className="flex justify-end space-x-2">
                                                                    <button onClick={() => handleView(cert)} className="text-gray-400 hover:text-blue-400 transition-colors"><FiEye className="w-5 h-5" /></button>
                                                                    <button onClick={() => handleDownload(cert)} className="text-gray-400 hover:text-blue-400 transition-colors"><FiDownload className="w-5 h-5" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="card overflow-hidden bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl shadow-xl hover:border-blue-500/50 transition-all duration-300">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-700/30">
                                        <thead className="bg-gray-800/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID Sertifikat</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Penerbit</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Judul</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Terbit</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tanggal Kedaluwarsa</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/30">
                                            {receivedCertificates.map((cert) => (
                                                <tr key={cert.id} className="hover:bg-blue-900/20 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 flex items-center gap-2">
                                                        {cert.id.substring(0, 10)}...
                                                        <button onClick={() => handleCopyId(cert.id)} className="ml-2 text-gray-400 hover:text-blue-400" title="Copy ID">
                                                            <FiCopy className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cert.issuerName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cert.certificateTitle}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(cert.issueDate).toLocaleDateString('id-ID')}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('id-ID') : '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(cert.status)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button onClick={() => handleView(cert)} className="text-gray-400 hover:text-blue-400 transition-colors"><FiEye className="w-5 h-5" /></button>
                                                            <button onClick={() => handleDownload(cert)} className="text-gray-400 hover:text-blue-400 transition-colors"><FiDownload className="w-5 h-5" /></button>
                                                        </div>
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
            </div>
        </div>
    );
};

export default Certificates; 