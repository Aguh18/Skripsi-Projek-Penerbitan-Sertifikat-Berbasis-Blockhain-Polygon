import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiUsers, FiCheckSquare } from 'react-icons/fi';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const DraftCertificates = () => {
    const [draftCertificates, setDraftCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isIssuer } = useAuth();

    useEffect(() => {
        if (!isIssuer()) {
            toast.error('Anda tidak memiliki akses ke halaman ini');
            return;
        }
        fetchDraftCertificates();
    }, []);

    const fetchDraftCertificates = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Sertifikat Draft</h1>

            {draftCertificates.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Belum ada sertifikat draft</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {draftCertificates.map((group) => (
                        <div key={group.template.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">{group.template.name}</h2>
                                <span className="text-sm text-gray-500">
                                    {group.certificates.length} sertifikat
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Penerima
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal Dibuat
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {group.certificates.map((cert) => (
                                            <tr key={cert.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {cert.recipient.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {cert.recipient.walletAddress}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(cert.createdAt).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <Link
                                                        to={`/certificates/${cert.id}`}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        Lihat
                                                    </Link>
                                                    <Link
                                                        to={`/certificates/${cert.id}/publish`}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Terbitkan
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DraftCertificates; 