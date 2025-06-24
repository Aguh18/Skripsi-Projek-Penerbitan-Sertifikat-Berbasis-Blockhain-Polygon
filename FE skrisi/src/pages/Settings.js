import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { toast } from 'react-toastify';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const { user, isVerifier } = useAuth();
    const [issuerReason, setIssuerReason] = useState('');
    const [issuerSubmitting, setIssuerSubmitting] = useState(false);
    const [issuerStatus, setIssuerStatus] = useState(null); // null | 'PENDING' | 'APPROVED' | 'REJECTED'
    const [issuerLoading, setIssuerLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            setProfileLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${getEnv('BASE_URL')}/api/account/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProfile({
                    name: res.data.data.name || '',
                    email: res.data.data.email || '',
                });
            } catch (err) {
                toast.error('Gagal mengambil data profil');
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        // Cek status pengajuan issuer
        const fetchIssuerStatus = async () => {
            if (!isVerifier()) return;
            setIssuerLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${getEnv('BASE_URL')}/api/account/issuer-application`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Cari pengajuan milik user saat ini dengan status PENDING
                const myApp = res.data.data.find(app => app.userId === user.walletAddress && app.status === 'PENDING');
                if (myApp) setIssuerStatus('PENDING');
                else setIssuerStatus(null);
            } catch (err) {
                setIssuerStatus(null);
            } finally {
                setIssuerLoading(false);
            }
        };
        fetchIssuerStatus();
    }, [isVerifier, user]);

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${getEnv('BASE_URL')}/api/account/profile`,
                profile,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Profil berhasil diupdate!');
        } catch (err) {
            toast.error('Gagal update profil');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleIssuerSubmit = async (e) => {
        e.preventDefault();
        if (!issuerReason.trim()) {
            toast.error('Alasan pengajuan wajib diisi');
            return;
        }
        setIssuerSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${getEnv('BASE_URL')}/api/account/issuer-application`,
                { name: profile.name, email: profile.email, reason: issuerReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Pengajuan issuer berhasil dikirim! Menunggu persetujuan admin.');
            setIssuerStatus('PENDING');
            setIssuerReason('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengirim pengajuan');
        }
        setIssuerSubmitting(false);
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
            <div className="max-w-4xl mx-auto p-6 relative z-10">
                <h1 className="text-3xl font-bold mb-8 text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Pengaturan</h1>
                {/* Profile Settings */}
                <div className="card mb-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 shadow-xl hover:border-blue-500/50 transition-all duration-300">
                    <div className="flex items-center space-x-4 mb-6">
                        <UserCircleIcon className="w-12 h-12 text-blue-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-300">Profil Pengguna</h2>
                            <p className="text-sm text-gray-400">{profile.email || '-'}</p>
                        </div>
                    </div>
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className="input-field"
                                disabled={profileLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profile.email}
                                onChange={handleProfileChange}
                                className="input-field"
                                disabled={profileLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                            disabled={profileLoading || profileSaving}
                        >
                            {profileSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>
                {/* Pengajuan Issuer - hanya untuk verifier */}
                {isVerifier() && (
                    <div className="card mb-6 bg-gray-800/30 backdrop-blur-sm border border-green-700/30 rounded-2xl p-8 shadow-xl hover:border-green-500/50 transition-all duration-300">
                        <h2 className="text-lg font-semibold text-green-400 mb-4">Ajukan Diri Sebagai Issuer</h2>
                        {issuerLoading ? (
                            <div className="text-gray-400">Memuat status pengajuan...</div>
                        ) : issuerStatus === 'PENDING' ? (
                            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-center font-semibold">
                                Status: <span className="uppercase">Waiting for Approval</span>
                            </div>
                        ) : (
                            <form className="space-y-4" onSubmit={handleIssuerSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        className="input-field"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        className="input-field"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Alasan Pengajuan</label>
                                    <textarea
                                        className="input-field min-h-[80px]"
                                        placeholder="Jelaskan mengapa Anda ingin menjadi issuer..."
                                        value={issuerReason}
                                        onChange={e => setIssuerReason(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn-primary group relative bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-green-500/25"
                                    disabled={issuerSubmitting}
                                >
                                    {issuerSubmitting ? 'Mengirim...' : 'Ajukan Sekarang'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings; 