import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfileGuard = ({ children }) => {
    const { user, login } = useAuth();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => {
        if (user) {
            const nameValid = user.name && user.name.trim().length > 2;
            const emailValid = user.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email);
            if (!nameValid || !emailValid) {
                setProfileForm({ name: user.name || '', email: user.email || '' });
                setShowProfileModal(true);
            } else {
                setShowProfileModal(false);
            }
        }
    }, [user]);

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const nameValid = profileForm.name && profileForm.name.trim().length > 2;
        const emailValid = profileForm.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profileForm.email);
        if (!nameValid) {
            alert('Nama minimal 3 karakter');
            return;
        }
        if (!emailValid) {
            alert('Email tidak valid');
            return;
        }
        setProfileSaving(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${process.env.REACT_APP_BASE_URL || 'http://localhost:5000'}/api/account/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });
            await login({ ...user, name: profileForm.name, email: profileForm.email });
            setShowProfileModal(false);
        } catch (err) {
            alert('Gagal update profil');
        }
        setProfileSaving(false);
    };

    if (showProfileModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-black/80">
                <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-md border border-blue-700/30">
                    <h2 className="text-2xl font-bold text-blue-400 mb-4 text-center">Lengkapi Profil Anda</h2>
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                value={profileForm.name}
                                onChange={handleProfileChange}
                                className="input-field"
                                minLength={3}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={profileForm.email}
                                onChange={handleProfileChange}
                                className="input-field"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 overflow-hidden hover:shadow-lg hover:shadow-blue-500/25"
                            disabled={profileSaving}
                        >
                            {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return children;
};

export default ProfileGuard; 