import React, { useState } from 'react';
import {
    UserCircleIcon,
    BellIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    KeyIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        updates: true,
        security: true,
    });

    const [preferences, setPreferences] = useState({
        language: 'id',
        theme: 'dark',
        timezone: 'Asia/Jakarta',
    });

    const [security, setSecurity] = useState({
        twoFactor: false,
        lastPasswordChange: '2024-05-15',
        loginHistory: [
            { date: '2024-05-28 14:30', device: 'Chrome on Windows', location: 'Jakarta' },
            { date: '2024-05-27 09:15', device: 'Safari on iOS', location: 'Bandung' },
            { date: '2024-05-25 18:45', device: 'Firefox on Linux', location: 'Surabaya' },
        ],
    });

    const handleNotificationChange = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handlePreferenceChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-gradient">Pengaturan</h1>

                {/* Profile Settings */}
                <div className="card mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <UserCircleIcon className="w-12 h-12 text-blue-500" />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-300">Profil Pengguna</h2>
                            <p className="text-sm text-gray-400">admin@example.com</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
                            <input
                                type="text"
                                defaultValue="Admin User"
                                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                defaultValue="admin@example.com"
                                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="card mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <BellIcon className="w-8 h-8 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-gray-300">Notifikasi</h2>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(notifications).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-gray-300 capitalize">{key}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={() => handleNotificationChange(key)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preferences */}
                <div className="card mb-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <GlobeAltIcon className="w-8 h-8 text-green-500" />
                        <h2 className="text-lg font-semibold text-gray-300">Preferensi</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Bahasa</label>
                            <select
                                value={preferences.language}
                                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="id">Bahasa Indonesia</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tema</label>
                            <select
                                value={preferences.theme}
                                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Zona Waktu</label>
                            <select
                                value={preferences.timezone}
                                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Asia/Jakarta">Jakarta (GMT+7)</option>
                                <option value="Asia/Singapore">Singapore (GMT+8)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="card">
                    <div className="flex items-center space-x-4 mb-6">
                        <ShieldCheckIcon className="w-8 h-8 text-red-500" />
                        <h2 className="text-lg font-semibold text-gray-300">Keamanan</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-300">Autentikasi Dua Faktor</h3>
                                <p className="text-sm text-gray-400">Tambahkan lapisan keamanan ekstra ke akun Anda</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={security.twoFactor}
                                    onChange={() => setSecurity(prev => ({ ...prev, twoFactor: !prev.twoFactor }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div>
                            <h3 className="text-gray-300 mb-4">Riwayat Login</h3>
                            <div className="space-y-3">
                                {security.loginHistory.map((login, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                                        <div>
                                            <p className="text-sm text-gray-300">{login.device}</p>
                                            <p className="text-xs text-gray-400">{login.location}</p>
                                        </div>
                                        <p className="text-sm text-gray-400">{login.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                                <KeyIcon className="w-5 h-5" />
                                <span>Ubah Password</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 