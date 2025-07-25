import { data } from 'autoprefixer';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { getEnv } from '../utils/env';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

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
    const [bulkExcelData, setBulkExcelData] = useState([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    const [mode, setMode] = useState('single'); // 'single' or 'bulk'

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
                    const id = response.data.data.id || response.data.data._id;
                    navigate(`/dashboard/issue-certificate/submit/${id}`, {
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

    // Bulk upload handlers
    const handleBulkFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const headers = data[0];
            const rows = data.slice(1).map(row =>
                Object.fromEntries(headers.map((h, i) => [h, row[i]]))
            );
            setBulkExcelData(rows);
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        setBulkUploading(true);
        try {
            // Inject template, issueDate, expiryDate from form to each row
            const bulkData = bulkExcelData.map(row => ({
                ...row,
                template: formData.template,
                issueDate: formData.issueDate,
                expiryDate: formData.expiryDate
            }));
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${getEnv('BASE_URL')}/api/certificate/bulk-generate`,
                { certificates: bulkData },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Bulk upload sukses!');
            setBulkExcelData([]);
        } catch (err) {
            toast.error('Bulk upload gagal!');
        }
        setBulkUploading(false);
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
            {(isSubmitting || bulkUploading) && <LoadingOverlay />}
            <div className="max-w-4xl mx-auto py-16 relative z-10">
                {/* Mode Switcher */}
                <div className="flex justify-center mb-8 space-x-4">
                    <button
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${mode === 'single' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                        onClick={() => setMode('single')}
                    >
                        Single Upload
                    </button>
                    <button
                        className={`px-6 py-2 rounded-lg font-semibold transition-all ${mode === 'bulk' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                        onClick={() => setMode('bulk')}
                    >
                        Bulk Upload (Excel)
                    </button>
                </div>
                {/* Single Upload Form */}
                {mode === 'single' && (
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
                )}
                {/* Bulk Upload Section */}
                {mode === 'bulk' && (
                    <form onSubmit={handleBulkSubmit} className="card bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 shadow-xl">
                        <h3 className="text-xl font-bold mb-4 text-blue-400">Bulk Upload Sertifikat (Excel)</h3>
                        {/* Certificate Template Download Section */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Template Excel Sertifikat</h3>
                                    <p className="text-gray-300 text-sm">Download template Excel untuk bulk upload sertifikat</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = '/certificate-template.xlsx';
                                        link.download = 'certificate-template.xlsx';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                                    title="Download Template Excel"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l-6-6m6 6l6-6" /></svg>
                                    <span>Download Template Excel</span>
                                </button>
                            </div>
                        </div>
                        <div className="mb-4">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                            </div>
                        </div>
                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkFileUpload} className="mb-4" />
                        {bulkExcelData.length > 0 && (
                            <>
                                <button type="submit" disabled={bulkUploading} className="btn-primary px-6 py-2 rounded-lg mb-4">
                                    {bulkUploading ? 'Uploading...' : 'Submit Bulk'}
                                </button>
                                <div className="overflow-x-auto max-h-64 border border-gray-700/30 rounded-lg bg-gray-900/50">
                                    <table className="min-w-full text-xs text-gray-300">
                                        <thead>
                                            <tr>
                                                {Object.keys(bulkExcelData[0]).map((h) => (
                                                    <th key={h} className="px-2 py-1 border-b border-gray-700/30">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkExcelData.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((v, j) => (
                                                        <td key={j} className="px-2 py-1 border-b border-gray-700/30">{v}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        <div className="mt-4 text-gray-400 text-xs">
                            <b>Format Excel:</b> Kolom <code>recipientName</code> dan <code>targetAddress</code> wajib diisi di file Excel.<br />
                            Kolom <code>template</code>, <code>issueDate</code>, <code>expiryDate</code> akan diambil dari form di atas dan otomatis diisi ke setiap baris saat upload.
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default IssueCertificate;