import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiDownload, FiEye, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const Certificates = () => {
    const [activeTab, setActiveTab] = useState('issued');

    // Dummy data untuk sertifikat yang diterbitkan
    const issuedCertificates = [
        {
            id: 'CERT-001',
            title: 'Sertifikat Kelulusan',
            recipient: 'John Doe',
            issueDate: '2024-03-15',
            expiryDate: '2025-03-15',
            status: 'active',
            targetAddress: '0x1234...5678'
        },
        {
            id: 'CERT-002',
            title: 'Sertifikat Workshop',
            recipient: 'Jane Smith',
            issueDate: '2024-03-10',
            expiryDate: '2025-03-10',
            status: 'active',
            targetAddress: '0x8765...4321'
        },
        // Tambahkan data dummy lainnya
    ];

    // Dummy data untuk sertifikat yang diterima
    const receivedCertificates = [
        {
            id: 'CERT-003',
            title: 'Sertifikat Pelatihan',
            issuer: 'Training Center',
            issueDate: '2024-03-01',
            expiryDate: '2025-03-01',
            status: 'active',
            issuerAddress: '0x9876...5432'
        },
        {
            id: 'CERT-004',
            title: 'Sertifikat Seminar',
            issuer: 'Tech Conference',
            issueDate: '2024-02-28',
            expiryDate: '2025-02-28',
            status: 'active',
            issuerAddress: '0x2468...1357'
        },
        // Tambahkan data dummy lainnya
    ];

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: {
                color: 'bg-green-500/10 text-green-400 border-green-500/20',
                icon: <FiCheckCircle className="w-4 h-4" />
            },
            expired: {
                color: 'bg-red-500/10 text-red-400 border-red-500/20',
                icon: <FiXCircle className="w-4 h-4" />
            }
        };

        const config = statusConfig[status] || statusConfig.active;

        return (
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                {config.icon}
                <span className="ml-1.5 capitalize">{status}</span>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gradient">Sertifikat</h1>
                    <Link
                        to="/issue-certificate"
                        className="btn-primary inline-flex items-center"
                    >
                        <FiPlus className="w-5 h-5 mr-2" />
                        Terbitkan Sertifikat
                    </Link>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-700/30">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('issued')}
                                className={`${activeTab === 'issued'
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                Sertifikat yang Diterbitkan
                            </button>
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
                                {(activeTab === 'issued' ? issuedCertificates : receivedCertificates).map((cert) => (
                                    <tr key={cert.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                                            {cert.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {activeTab === 'issued' ? cert.recipient : cert.issuer}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {cert.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {cert.issueDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {cert.expiryDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(cert.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                                    <FiEye className="w-5 h-5" />
                                                </button>
                                                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                                                    <FiDownload className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificates; 