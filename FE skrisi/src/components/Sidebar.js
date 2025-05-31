import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import SidebarButton from "./sidebar/button";

function Sidebar({ isCollapsed, onToggle }) {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 h-full bg-gray-900/50 backdrop-blur-sm border-r border-gray-800/50 py-6`}>
            <div className={`px-4 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onToggle}
                        className="bg-gray-800 rounded-full p-1 hover:bg-gray-700 transition-colors"
                    >
                        <svg
                            className={`w-4 h-4 text-gray-400 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className={`${isCollapsed ? 'px-2' : 'px-4'} mb-6`}>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
                <SidebarButton
                    props={{
                        text: 'Dashboard',
                        icon: 'home',
                        link: '/dashboard',
                        isActive: isActive('/dashboard'),
                        isCollapsed
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Sertifikat',
                        icon: 'certificate',
                        link: '/certificates',
                        isActive: isActive('/certificates'),
                        isCollapsed
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Template',
                        icon: 'upload',
                        link: '/template',
                        isActive: isActive('/template'),
                        isCollapsed
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Verifikasi Sertifikat',
                        icon: 'check-circle',
                        link: '/verify-certificate',
                        isActive: isActive('/verify-certificate'),
                        isCollapsed
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Riwayat Aktivitas',
                        icon: 'clock',
                        link: '/activity-log',
                        isActive: isActive('/activity-log'),
                        isCollapsed
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Pengaturan',
                        icon: 'gear',
                        link: '/settings',
                        isActive: isActive('/settings'),
                        isCollapsed
                    }}
                />
                <div className={`${isCollapsed ? 'px-2' : 'px-4'} mt-6`}>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;