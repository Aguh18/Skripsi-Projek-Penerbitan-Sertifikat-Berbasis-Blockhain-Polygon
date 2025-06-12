import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const location = useLocation();
    const { isIssuer, isVerifier } = useAuth();

    const getErrorMessage = () => {
        const path = location.pathname;
        if (path.includes('issue-certificate') || path.includes('certificates') || path.includes('template')) {
            return 'Anda tidak memiliki akses untuk menerbitkan sertifikat. Hanya pengguna dengan peran issuer yang dapat mengakses halaman ini.';
        }
        if (path.includes('verify-certificate')) {
            return 'Anda tidak memiliki akses untuk memverifikasi sertifikat. Hanya pengguna dengan peran issuer atau verifier yang dapat mengakses halaman ini.';
        }
        return 'Anda tidak memiliki akses ke halaman ini.';
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="text-center p-8 rounded-lg bg-gray-800/50 border border-gray-700/50 max-w-md">
                <h1 className="text-4xl font-bold text-red-500 mb-4">401</h1>
                <h2 className="text-2xl font-semibold text-gray-300 mb-4">Akses Ditolak</h2>
                <p className="text-gray-400 mb-8">{getErrorMessage()}</p>
                <div className="space-y-4">
                    <Link
                        to="/dashboard"
                        className="inline-block w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Kembali ke Dashboard
                    </Link>
                    <Link
                        to="/login"
                        className="inline-block w-full bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Login dengan Akun Lain
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized; 