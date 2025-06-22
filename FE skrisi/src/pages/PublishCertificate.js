import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';

const PublishCertificate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        fetchCertificate();
    }, [id]);

    const fetchCertificate = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${getEnv('BASE_URL')}/api/certificate/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCertificate(response.data.data);
            } else {
                toast.error('Sertifikat tidak ditemukan');
                navigate('/certificates');
            }
        } catch (error) {
            toast.error('Gagal mengambil data sertifikat');
            navigate('/certificates');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            setPublishing(true);
            const token = localStorage.getItem('token');
            // Panggil endpoint backend untuk publish ke blockchain dan update status
            const response = await axios.post(`${getEnv('BASE_URL')}/api/certificate/${id}/publish`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Sertifikat berhasil diterbitkan ke blockchain!');
                navigate('/certificates');
            } else {
                toast.error('Gagal menerbitkan sertifikat');
            }
        } catch (error) {
            toast.error('Gagal menerbitkan sertifikat');
        } finally {
            setPublishing(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    if (!certificate) {
        return null;
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="bg-white/10 p-8 rounded-lg shadow-lg max-w-xl w-full">
                <h2 className="text-2xl font-bold mb-4 text-white">Terbitkan Sertifikat</h2>
                <div className="mb-4 text-white">
                    <div><b>Nama Penerima:</b> {certificate.recipientName}</div>
                    <div><b>Judul:</b> {certificate.certificateTitle}</div>
                    <div><b>Tanggal Terbit:</b> {new Date(certificate.issueDate).toLocaleDateString()}</div>
                    <div><b>Tanggal Kadaluarsa:</b> {certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString() : '-'}</div>
                    <div><b>Status:</b> {certificate.status}</div>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full btn-primary bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg hover:shadow-blue-500/25"
                >
                    {publishing ? 'Menerbitkan...' : 'Terbitkan ke Blockchain'}
                </button>
            </div>
        </div>
    );
};

export default PublishCertificate; 