import React, { useState } from 'react';
import {
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const History = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    // Dummy data for certificate history
    const certificateHistory = [
        {
            id: 'CERT001',
            title: 'Sertifikat Pelatihan Web Development',
            recipient: 'John Doe',
            date: '2024-05-28 14:30',
            status: 'Terverifikasi',
            hash: '0x1234...5678',
            type: 'Pelatihan',
        },
        {
            id: 'CERT002',
            title: 'Sertifikat Akademik Semester 1',
            recipient: 'Jane Smith',
            date: '2024-05-27 09:15',
            status: 'Menunggu',
            hash: '0x8765...4321',
            type: 'Akademik',
        },
        {
            id: 'CERT003',
            title: 'Sertifikat Profesional UI/UX',
            recipient: 'Mike Johnson',
            date: '2024-05-26 18:45',
            status: 'Terverifikasi',
            hash: '0x9876...1234',
            type: 'Profesional',
        },
        {
            id: 'CERT004',
            title: 'Sertifikat Pelatihan Blockchain',
            recipient: 'Sarah Wilson',
            date: '2024-05-25 11:20',
            status: 'Ditolak',
            hash: '0x5678...9012',
            type: 'Pelatihan',
        },
        {
            id: 'CERT005',
            title: 'Sertifikat Workshop AI',
            recipient: 'David Brown',
            date: '2024-05-24 16:30',
            status: 'Terverifikasi',
            hash: '0x3456...7890',
            type: 'Workshop',
        },
    ];

    // Dummy data for activity log
    const activityLog = [
        {
            id: 1,
            action: 'Sertifikat Diterbitkan',
            details: 'CERT001 - Sertifikat Pelatihan Web Development',
            timestamp: '2024-05-28 14:30',
            user: 'Admin',
        },
        {
            id: 2,
            action: 'Verifikasi Sertifikat',
            details: 'CERT003 - Sertifikat Profesional UI/UX',
            timestamp: '2024-05-26 18:45',
            user: 'Verifier',
        },
        {
            id: 3,
            action: 'Pembaruan Template',
            details: 'Template Sertifikat Akademik diperbarui',
            timestamp: '2024-05-25 09:15',
            user: 'Admin',
        },
        {
            id: 4,
            action: 'Penolakan Sertifikat',
            details: 'CERT004 - Sertifikat Pelatihan Blockchain',
            timestamp: '2024-05-25 11:20',
            user: 'Verifier',
        },
    ];

    const filteredCertificates = certificateHistory.filter(cert => {
        const matchesSearch =
            cert.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.recipient.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filter === 'all' || cert.status.toLowerCase() === filter.toLowerCase();

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="animate-fade-in">
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-gradient">Riwayat</h1>

                {/* Search and Filter */}
                <div className="card mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari sertifikat..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="terverifikasi">Terverifikasi</option>
                            <option value="menunggu">Menunggu</option>
                            <option value="ditolak">Ditolak</option>
                        </select>
                    </div>
                </div>

                {/* Certificate History */}
                <div className="card mb-6">
                    <h2 className="text-lg font-semibold text-gray-300 mb-4">Riwayat Sertifikat</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-700/30">
                                    <th className="pb-3 text-sm font-medium text-gray-400">ID</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Judul</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Penerima</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Tanggal</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Tipe</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCertificates.map((cert) => (
                                    <tr key={cert.id} className="border-b border-gray-700/30 last:border-0">
                                        <td className="py-3 text-sm text-gray-300 font-mono">{cert.id}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.title}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.recipient}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.date}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.type}</td>
                                        <td className="py-3 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${cert.status === 'Terverifikasi'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : cert.status === 'Menunggu'
                                                            ? 'bg-yellow-500/10 text-yellow-400'
                                                            : 'bg-red-500/10 text-red-400'
                                                    }`}
                                            >
                                                {cert.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-gray-300 font-mono">{cert.hash}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Log */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-300 mb-4">Log Aktivitas</h2>
                    <div className="space-y-4">
                        {activityLog.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    {activity.action.includes('Diterbitkan') && (
                                        <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                                    )}
                                    {activity.action.includes('Verifikasi') && (
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    )}
                                    {activity.action.includes('Pembaruan') && (
                                        <ArrowPathIcon className="w-5 h-5 text-yellow-500" />
                                    )}
                                    {activity.action.includes('Penolakan') && (
                                        <XCircleIcon className="w-5 h-5 text-red-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-gray-300">{activity.action}</h3>
                                        <span className="text-xs text-gray-400">{activity.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{activity.details}</p>
                                    <div className="flex items-center mt-2">
                                        <ClockIcon className="w-4 h-4 text-gray-400 mr-1" />
                                        <span className="text-xs text-gray-400">Oleh: {activity.user}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default History; 