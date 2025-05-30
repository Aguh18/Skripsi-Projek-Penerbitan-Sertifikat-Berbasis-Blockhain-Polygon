import { data } from 'autoprefixer';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { getEnv } from '../utils/env';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
        certificateTitle: '',
        issueDate: '',
        expiryDate: '',
        description: '',
        signature: null,
        category: '',
        issuerAddress: localStorage.getItem("walletAddress"),
        issuerName: localStorage.getItem("walletAddress"),
        targetAddress: '',
    });
    const [templateName, setTemplateName] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `${getEnv('BASE_URL')}/api/certificate/template`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log('Full response:', response.data);

                // Jika response.data = { data: { templates: [...] } }
                setTemplateName(response.data.data.templates);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: '' });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 2 * 1024 * 1024) {
            setErrors({ ...errors, signature: 'Ukuran file maksimum 2MB' });
            return;
        }
        setFormData({ ...formData, signature: file });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.template) newErrors.template = 'Template wajib dipilih';
        if (!formData.recipientName) newErrors.recipientName = 'Nama penerima wajib diisi';
        else if (!/^[a-zA-Z\s'-]+$/.test(formData.recipientName))
            newErrors.recipientName = 'Nama hanya boleh berisi huruf, spasi, tanda hubung, atau apostrof';
        if (!formData.certificateTitle) newErrors.certificateTitle = 'Judul sertifikat wajib diisi';
        if (!formData.issueDate) newErrors.issueDate = 'Tanggal penerbitan wajib diisi';

        if (formData.expiryDate && formData.expiryDate < formData.issueDate)
            newErrors.expiryDate = 'Tanggal kedaluwarsa harus lebih baru dari tanggal penerbitan';
        if (!formData.targetAddress) newErrors.targetAddress = 'Alamat target wajib diisi';
        else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.targetAddress))
            newErrors.targetAddress = 'Alamat target tidak valid';
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
            const response = await axios.post(
                `${getEnv('BASE_URL')}/api/certificate/generate-from-template`,
                {
                    templateId: formData.template,
                    recipientName: formData.recipientName,
                    certificateTitle: formData.certificateTitle,
                    issueDate: formData.issueDate,
                    expiryDate: formData.expiryDate,
                    description: formData.description,
                    category: formData.category,
                    targetAddress: formData.targetAddress,
                },
                {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`Upload Progress: ${percentCompleted}%`);
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
                    style: {
                        background: '#1F2937',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '500',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }
                });

                setTimeout(() => {
                    navigate('/issue-certificate/submit', {
                        state: {
                            data: response.data.data,
                        },
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Gagal membuat sertifikat. Silakan coba lagi.', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                style: {
                    background: '#1F2937',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            });
            setErrors({ submit: 'Gagal membuat sertifikat. Silakan coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {isSubmitting && <LoadingOverlay />}
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gradient">Terbitkan Sertifikat</h2>
                <form onSubmit={handleSubmit} className="card space-y-6">
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

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Judul Sertifikat</label>
                            <input
                                type="text"
                                name="certificateTitle"
                                value={formData.certificateTitle}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                            {errors.certificateTitle && (
                                <p className="text-red-400 text-sm mt-1">{errors.certificateTitle}</p>
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
                                {errors.issueDate && <p className="text-red-400 text-sm mt-1">{errors.issueDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Tanggal Kedaluwarsa (Opsional)
                                </label>
                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={formData.expiryDate}
                                    onChange={handleChange}
                                    className="input-field"
                                />
                                {errors.expiryDate && (
                                    <p className="text-red-400 text-sm mt-1">{errors.expiryDate}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Deskripsi (Opsional)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="input-field"
                                rows="4"
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Tanda Tangan (Opsional)
                            </label>
                            <input
                                type="file"
                                name="signature"
                                onChange={handleFileChange}
                                className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                                accept="image/png,image/jpeg"
                            />
                            {errors.signature && (
                                <p className="text-red-400 text-sm mt-1">{errors.signature}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Kategori (Opsional)
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="">Pilih Kategori</option>
                                <option value="academic">Akademik</option>
                                <option value="professional">Profesional</option>
                                <option value="training">Pelatihan</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Alamat Target
                            </label>
                            <input
                                type="text"
                                name="targetAddress"
                                value={formData.targetAddress}
                                onChange={handleChange}
                                className="input-field font-mono"
                                placeholder="0x..."
                                required
                            />
                            {errors.targetAddress && (
                                <p className="text-red-400 text-sm mt-1">{errors.targetAddress}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700/30">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn-secondary"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                        >
                            Terbitkan Sertifikat
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default IssueCertificate;