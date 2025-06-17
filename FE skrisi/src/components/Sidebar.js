import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import SidebarButton from "./sidebar/button";
import { useAuth } from '../context/AuthContext';

function Sidebar({ isCollapsed, onToggle }) {
    const location = useLocation();
    const { isIssuer, isVerifier } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 h-full bg-gray-900/60 backdrop-blur-xl border-r border-blue-500/20 shadow-xl relative z-20`}>
            {/* Gradient/blur overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-2xl"></div>
            </div>
            <div className={`px-4 space-y-3 py-4 ${isCollapsed ? 'px-2' : ''} relative z-10`}>
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onToggle}
                        className="bg-gray-800/70 rounded-full p-1 hover:bg-blue-700/40 transition-colors border border-blue-500/20 shadow"
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
                    <div className="h-px bg-gradient-to-r from-transparent via-blue-700 to-transparent"></div>
                </div>

                {/* Menu untuk semua user */}
                <SidebarButton
                    props={{
                        text: 'Dashboard',
                        icon: 'home',
                        link: '/dashboard',
                        isActive: isActive('/dashboard'),
                        isCollapsed
                    }}
                />

                {/* Menu Sertifikat untuk semua user */}
                <SidebarButton
                    props={{
                        text: 'Sertifikat',
                        icon: 'certificate',
                        link: '/dashboard/certificates',
                        isActive: isActive('/dashboard/certificates'),
                        isCollapsed
                    }}
                />

                {/* Menu Template hanya untuk issuer */}
                {isIssuer() && (
                    <SidebarButton
                        props={{
                            text: 'Template',
                            icon: 'upload',
                            link: '/dashboard/template',
                            isActive: isActive('/dashboard/template'),
                            isCollapsed
                        }}
                    />
                )}

                {/* Menu untuk issuer dan verifier */}
                {(isIssuer() || isVerifier()) && (
                    <SidebarButton
                        props={{
                            text: 'Verifikasi Sertifikat',
                            icon: 'check-circle',
                            link: '/dashboard/verify-certificate',
                            isActive: isActive('/dashboard/verify-certificate'),
                            isCollapsed
                        }}
                    />
                )}

                {/* Menu untuk semua user */}
                <SidebarButton
                    props={{
                        text: 'Pengaturan',
                        icon: 'gear',
                        link: '/dashboard/settings',
                        isActive: isActive('/dashboard/settings'),
                        isCollapsed
                    }}
                />

                <div className={`${isCollapsed ? 'px-2' : 'px-4'} mt-6`}>
                    <div className="h-px bg-gradient-to-r from-transparent via-blue-700 to-transparent"></div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;