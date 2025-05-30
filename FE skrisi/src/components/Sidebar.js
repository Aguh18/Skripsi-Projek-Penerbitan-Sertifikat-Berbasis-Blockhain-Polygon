import { useLocation } from 'react-router-dom';
import SidebarButton from "./sidebar/button";

function Sidebar() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <aside className="w-full h-full bg-gray-900/50 backdrop-blur-sm border-r border-gray-800/50 py-6">
            <div className="px-4 space-y-1">
                <div className="px-4 mb-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
                <SidebarButton
                    props={{
                        text: 'Dashboard',
                        icon: 'home',
                        link: '/dashboard',
                        isActive: isActive('/dashboard')
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Kelola Sertifikat',
                        icon: 'certificate',
                        link: '/certificates',
                        isActive: isActive('/certificates')
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Terbitkan Sertifikat',
                        icon: 'plus-circle',
                        link: '/issue-certificate',
                        isActive: isActive('/issue-certificate')
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Template',
                        icon: 'upload',
                        link: '/upload-template',
                        isActive: isActive('/upload-template')
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Verifikasi Sertifikat',
                        icon: 'check-circle',
                        link: '/verify-certificate',
                        isActive: isActive('/verify-certificate')
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Riwayat Aktivitas',
                        icon: 'clock',
                        link: '/activity-log',
                        isActive: isActive('/activity-log')
                    }}
                />
                <SidebarButton
                    props={{
                        text: 'Pengaturan',
                        icon: 'gear',
                        link: '/settings',
                        isActive: isActive('/settings')
                    }}
                />
                <div className="px-4 mt-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;