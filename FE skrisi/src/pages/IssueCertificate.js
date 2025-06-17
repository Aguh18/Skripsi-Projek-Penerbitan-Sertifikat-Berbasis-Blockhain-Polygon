import { data } from 'autoprefixer';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { getEnv } from '../utils/env';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-medium">Memproses Sertifikat...</p>
        </div>
    </div>
);

const IssueCertificate = () => {
    const [formData, setFormData] = useState({
        template: '',
        recipientName: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        targetAddress: '',
        issuerAddress: localStorage.getItem("walletAddress"),
        issuerName: localStorage.getItem("walletAddress"),
    });
    const [templateName, setTemplateName] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { isIssuer } = useAuth();

    useEffect(() => {
        if (!isIssuer()) {
            toast.error('Anda tidak memiliki akses untuk menerbitkan sertifikat');
            navigate('/dashboard');
            return;
        }
        const fetchTemplates = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('Silakan login terlebih dahulu');
                    navigate('/login');
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
                    setTemplateName(response.data.data.templates);
                } else {
                    toast.error('Format data template tidak valid');
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
                if (error.response?.status === 401) {
                    toast.error('Sesi anda telah berakhir. Silakan login kembali.');
                    navigate('/login');
                } else {
                    toast.error('Gagal mengambil data template');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [navigate, isIssuer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.template) newErrors.template = 'Template wajib dipilih';
        if (!formData.recipientName) newErrors.recipientName = 'Nama penerima wajib diisi';
        else if (!/^[a-zA-Z\s'-]+$/.test(formData.recipientName))
            newErrors.recipientName = 'Nama hanya boleh berisi huruf, spasi, tanda hubung, atau apostrof';
        if (!formData.targetAddress) newErrors.targetAddress = 'Alamat target wajib diisi';
        else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.targetAddress))
            newErrors.targetAddress = 'Alamat target tidak valid';
        if (formData.expiryDate && formData.expiryDate < formData.issueDate) {
            newErrors.expiryDate = 'Tanggal kadaluarsa harus lebih baru dari tanggal penerbitan';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsSubmitting(true);
        try {
            let issuerName = '-';
            try {
                const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                issuerName = userProfile.name || '-';
            } catch { }
            const response = await axios.post(
                `${getEnv('BASE_URL')}/api/certificate/generate-from-template`,
                {
                    templateId: formData.template,
                    recipientName: formData.recipientName,
                    issueDate: formData.issueDate,
                    expiryDate: formData.expiryDate || null,
                    targetAddress: formData.targetAddress,
                    issuerName,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (response.status === 201) {
                toast.success('Sertifikat berhasil dibuat!', {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                });
                setTimeout(() => {
                    navigate('/dashboard/issue-certificate/submit', {
                        state: {
                            data: response.data.data,
                        },
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Error creating certificate:', error);
            if (error.response?.status === 401) {
                toast.error('Sesi anda telah berakhir. Silakan login kembali.');
                navigate('/login');
            } else {
                toast.error('Gagal membuat sertifikat. Silakan coba lagi.');
            }
            setErrors({ submit: 'Gagal membuat sertifikat. Silakan coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // THEME: Space/Nebula background, glassmorphism card, modern gradient, consistent button/input style
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
            {isSubmitting && <LoadingOverlay />}
            <div className="max-w-4xl mx-auto py-16 relative z-10">
                <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Terbitkan Sertifikat</h2>
                <form onSubmit={handleSubmit} className="card space-y-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 shadow-xl hover:border-blue-500/50 transition-all duration-300">
                    {errors.submit && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                            {errors.submit}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Template Sertifikat</label>
                            <select
                                name="template"
                                value={formData.template}
                                onChange={handleChange}
                                className="input-field"
                                required
                            >
                                <option value="">Pilih Template</option>
                                {templateName.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                            {errors.template && <p className="text-red-400 text-sm mt-1">{errors.template}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nama Penerima</label>
                            <input
                                type="text"
                                name="recipientName"
                                value={formData.recipientName}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                            {errors.recipientName && (
                                <p className="text-red-400 text-sm mt-1">{errors.recipientName}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tanggal Penerbitan</label>
                                <input
                                    type="date"
                                    name="issueDate"
                                    value={formData.issueDate}
                                    onChange={handleChange}
                                    className="input-field"
                                    required
                                />
                                {errors.issueDate && (
                                    <p className="text-red-400 text-sm mt-1">{errors.issueDate}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tanggal Kadaluarsa (Opsional)
                                </label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleChange}
                                    className="input-field"
                                    min={formData.issueDate}
                                />
                                {errors.expiryDate && (
                                    <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Alamat Target</label>
                            <input
                                type="text"
                                name="targetAddress"
                                value={formData.targetAddress}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="0x..."
                                required
                            />
                            {errors.targetAddress && (
                                <p className="text-red-400 text-sm mt-1">{errors.targetAddress}</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full btn-primary group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                        >
                            {isSubmitting ? 'Memproses...' : 'Terbitkan Sertifikat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IssueCertificate;