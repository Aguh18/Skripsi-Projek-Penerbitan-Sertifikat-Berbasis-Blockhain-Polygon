import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiDownload, FiEye, FiCheckCircle, FiXCircle, FiFileText, FiUsers, FiCheckSquare } from 'react-icons/fi';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('received');
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [receivedCertificates, setReceivedCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReceived: 0,
        activeCertificates: 0
    });
    const { isIssuer, isVerifier } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authorized to access dashboard
        if (!isIssuer() && !isVerifier()) {
            toast.error('Anda tidak memiliki akses ke halaman ini');
            navigate('/login');
            return;
        }

        fetchCertificates();
    }, [activeTab, isIssuer, isVerifier, navigate]);

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
                    setStats(prev => ({
                        ...prev,
                        totalIssued: response.data.data.length,
                        activeCertificates: response.data.data.filter(cert => cert.status === 'ACTIVE').length
                    }));
                } else {
                    setReceivedCertificates(response.data.data);
                    setStats(prev => ({
                        ...prev,
                        totalReceived: response.data.data.length,
                        activeCertificates: response.data.data.filter(cert => cert.status === 'ACTIVE').length
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
            toast.error('Gagal mengambil data sertifikat');
        } finally {
            setLoading(false);
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

    return (
        <div className="animate-fade-in">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>
                    {isIssuer() && (
                        <Link
                            to="/issue-certificate"
                            className="btn-primary inline-flex items-center"
                        >
                            <FiPlus className="w-5 h-5 mr-2" />
                            Terbitkan Sertifikat
                        </Link>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {isIssuer() && (
                        <div className="card p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                                    <FiFileText className="w-6 h-6" />
                                </div>
                                <div className="ml-4">
                                    <h2 className="text-sm font-medium text-gray-400">Total Sertifikat Diterbitkan</h2>
                                    <p className="text-2xl font-semibold text-white">{stats.totalIssued || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="card p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-500/10 text-green-400">
                                <FiCheckSquare className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-400">Sertifikat Aktif</h2>
                                <p className="text-2xl font-semibold text-white">{stats.activeCertificates || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
                                <FiUsers className="w-6 h-6" />
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-400">Total Sertifikat Diterima</h2>
                                <p className="text-2xl font-semibold text-white">{stats.totalReceived || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-700/30">
                        <nav className="-mb-px flex space-x-8">
                            {isIssuer() && (
                                <button
                                    onClick={() => setActiveTab('issued')}
                                    className={`${activeTab === 'issued'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Sertifikat yang Diterbitkan
                                </button>
                            )}
                            <button
                                onClick={() => setActiveTab('received')}
                                className={`${activeTab === 'received'
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Sertifikat yang Diterima
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/30">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ID Sertifikat
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        {activeTab === 'issued' ? 'Penerima' : 'Penerbit'}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Judul
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Tanggal Terbit
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Tanggal Kedaluwarsa
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : (activeTab === 'issued' ? issuedCertificates : receivedCertificates).length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                                            Tidak ada sertifikat
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'issued' ? issuedCertificates : receivedCertificates).map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                                                {cert.id.substring(0, 10)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {activeTab === 'issued' ? cert.recipientName : cert.issuerName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {cert.certificateTitle}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(cert.issueDate).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(cert.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleView(cert)}
                                                        className="text-gray-400 hover:text-gray-300 transition-colors"
                                                    >
                                                        <FiEye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(cert)}
                                                        className="text-gray-400 hover:text-gray-300 transition-colors"
                                                    >
                                                        <FiDownload className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;