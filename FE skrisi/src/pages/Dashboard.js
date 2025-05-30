import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    DocumentCheckIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Dummy data for charts
const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
        {
            label: 'Sertifikat Diterbitkan',
            data: [12, 19, 15, 25, 22, 30],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.4,
        },
    ],
};

const categoryData = {
    labels: ['Akademik', 'Profesional', 'Pelatihan', 'Lainnya'],
    datasets: [
        {
            data: [35, 25, 20, 20],
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(139, 92, 246, 0.8)',
            ],
            borderColor: [
                'rgba(59, 130, 246, 1)',
                'rgba(16, 185, 129, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(139, 92, 246, 1)',
            ],
            borderWidth: 1,
        },
    ],
};

const verificationData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
        {
            label: 'Verifikasi Berhasil',
            data: [10, 15, 12, 20, 18, 25],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
        },
        {
            label: 'Verifikasi Gagal',
            data: [2, 4, 3, 5, 4, 5],
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
        },
    ],
};

// Dummy data for recent certificates
const recentCertificates = [
    {
        id: 'CERT001',
        title: 'Sertifikat Pelatihan Web Development',
        recipient: 'John Doe',
        date: '2024-05-28',
        status: 'Terverifikasi',
    },
    {
        id: 'CERT002',
        title: 'Sertifikat Akademik Semester 1',
        recipient: 'Jane Smith',
        date: '2024-05-27',
        status: 'Menunggu',
    },
    {
        id: 'CERT003',
        title: 'Sertifikat Profesional UI/UX',
        recipient: 'Mike Johnson',
        date: '2024-05-26',
        status: 'Terverifikasi',
    },
    {
        id: 'CERT004',
        title: 'Sertifikat Pelatihan Blockchain',
        recipient: 'Sarah Wilson',
        date: '2024-05-25',
        status: 'Ditolak',
    },
];

const Dashboard = () => {
    return (
        <div className="animate-fade-in">
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6 text-gradient">Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="card flex items-center space-x-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <DocumentCheckIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Sertifikat</p>
                            <p className="text-2xl font-semibold text-gray-300">1,234</p>
                        </div>
                    </div>
                    <div className="card flex items-center space-x-4">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Terverifikasi</p>
                            <p className="text-2xl font-semibold text-gray-300">1,100</p>
                        </div>
                    </div>
                    <div className="card flex items-center space-x-4">
                        <div className="p-3 bg-yellow-500/10 rounded-lg">
                            <ClockIcon className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Menunggu</p>
                            <p className="text-2xl font-semibold text-gray-300">89</p>
                        </div>
                    </div>
                    <div className="card flex items-center space-x-4">
                        <div className="p-3 bg-red-500/10 rounded-lg">
                            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Ditolak</p>
                            <p className="text-2xl font-semibold text-gray-300">45</p>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-300 mb-4">Tren Sertifikat Bulanan</h2>
                        <div className="h-80">
                            <Line
                                data={monthlyData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: {
                                                color: '#9CA3AF',
                                            },
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: 'rgba(75, 85, 99, 0.2)',
                                            },
                                            ticks: {
                                                color: '#9CA3AF',
                                            },
                                        },
                                        x: {
                                            grid: {
                                                color: 'rgba(75, 85, 99, 0.2)',
                                            },
                                            ticks: {
                                                color: '#9CA3AF',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-300 mb-4">Distribusi Kategori</h2>
                        <div className="h-80">
                            <Doughnut
                                data={categoryData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: {
                                                color: '#9CA3AF',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Verification Chart */}
                <div className="card mb-6">
                    <h2 className="text-lg font-semibold text-gray-300 mb-4">Statistik Verifikasi</h2>
                    <div className="h-80">
                        <Bar
                            data={verificationData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: '#9CA3AF',
                                        },
                                    },
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(75, 85, 99, 0.2)',
                                        },
                                        ticks: {
                                            color: '#9CA3AF',
                                        },
                                    },
                                    x: {
                                        grid: {
                                            color: 'rgba(75, 85, 99, 0.2)',
                                        },
                                        ticks: {
                                            color: '#9CA3AF',
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Recent Certificates Table */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-300 mb-4">Sertifikat Terbaru</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-700/30">
                                    <th className="pb-3 text-sm font-medium text-gray-400">ID</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Judul</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Penerima</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Tanggal</th>
                                    <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCertificates.map((cert) => (
                                    <tr key={cert.id} className="border-b border-gray-700/30 last:border-0">
                                        <td className="py-3 text-sm text-gray-300 font-mono">{cert.id}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.title}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.recipient}</td>
                                        <td className="py-3 text-sm text-gray-300">{cert.date}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;