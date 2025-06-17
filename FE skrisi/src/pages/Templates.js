import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiDownload, FiEye, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getEnv } from '../utils/env';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Silakan login terlebih dahulu');
                return;
            }

            const response = await axios.get(
                `${getEnv('BASE_URL')}/api/certificate/template`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success && response.data.data.templates) {
                // Filter out deleted templates
                const activeTemplates = response.data.data.templates.filter(
                    template => !template.isDeleted
                );
                setTemplates(activeTemplates);
            } else {
                toast.error('Format data template tidak valid');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            if (error.response?.status === 401) {
                toast.error('Sesi anda telah berakhir. Silakan login kembali.');
            } else {
                toast.error('Gagal mengambil data template');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (templateId) => {
        if (!window.confirm('Apakah anda yakin ingin menghapus template ini?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Silakan login terlebih dahulu');
                return;
            }

            // Ensure templateId is an integer
            const templateIdInt = parseInt(templateId);
            if (isNaN(templateIdInt)) {
                toast.error('ID template tidak valid');
                return;
            }

            const response = await axios.delete(
                `${getEnv('BASE_URL')}/api/certificate/template/${templateIdInt}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success('Template berhasil dihapus');
                // Update local state by removing the deleted template
                setTemplates(templates.filter(template => template.id !== templateIdInt));
            } else {
                toast.error(response.data.message || 'Gagal menghapus template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            if (error.response?.status === 401) {
                toast.error('Sesi anda telah berakhir. Silakan login kembali.');
            } else if (error.response?.status === 404) {
                toast.error('Template tidak ditemukan atau anda tidak memiliki akses');
            } else {
                toast.error(error.response?.data?.message || 'Gagal menghapus template');
            }
        }
    };

    const handleDownload = (filePath) => {
        window.open(filePath, '_blank');
    };

    const handlePreview = (filePath) => {
        window.open(filePath, '_blank');
    };

    if (loading) {
        return (
            <div className="animate-fade-in">
                <div className="max-w-7xl mx-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gradient">Template Sertifikat</h1>
                    </div>
                    <div className="card overflow-hidden">
                        <div className="p-6 text-center text-gray-400">
                            Memuat data template...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold mb-8 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Template Sertifikat</h1>
                    <Link
                        to="/dashboard/upload-template"
                        className="btn-primary inline-flex items-center group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                    >
                        <FiPlus className="w-5 h-5 mr-2" />
                        Upload Template Baru
                    </Link>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700/30">
                            <thead className="bg-gray-800/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        ID Template
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Nama Template
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Tanggal Dibuat
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/30">
                                {templates.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-400">
                                            Belum ada template yang dibuat
                                        </td>
                                    </tr>
                                ) : (
                                    templates.map((template) => (
                                        <tr key={template.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                                                {template.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {template.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                {new Date(template.createdAt).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handlePreview(template.filePath)}
                                                        className="text-gray-400 hover:text-gray-300 transition-colors"
                                                        title="Lihat Template"
                                                    >
                                                        <FiEye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(template.filePath)}
                                                        className="text-gray-400 hover:text-gray-300 transition-colors"
                                                        title="Download Template"
                                                    >
                                                        <FiDownload className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(template.id)}
                                                        className="text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Hapus Template"
                                                    >
                                                        <FiTrash2 className="w-5 h-5" />
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

export default Templates; 