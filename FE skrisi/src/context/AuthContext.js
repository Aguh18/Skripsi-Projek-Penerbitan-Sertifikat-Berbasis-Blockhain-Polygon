import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token = localStorage.getItem('token');
                const userProfile = localStorage.getItem('userProfile');

                if (token && userProfile) {
                    const userData = JSON.parse(userProfile);
                    console.log('Initializing with user data:', userData); // Debug log

                    if (userData.role) {
                        setUser(userData);
                        setRole(userData.role);
                        console.log('Role set to:', userData.role); // Debug log
                    } else {
                        console.error('No role found in user data');
                        setRole('verifier'); // Default role if none found
                    }
                } else {
                    console.log('No token or user profile found in localStorage');
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (userData) => {
        try {
            console.log('Login called with user data:', userData); // Debug log
            setUser(userData);
            setRole(userData.role);
            console.log('Role set to:', userData.role); // Debug log
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log('Logging out, clearing localStorage'); // Debug log
        localStorage.removeItem('token');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
        setUser(null);
        setRole(null);
    };

    const isIssuer = () => {
        console.log('Checking isIssuer, current role:', role); // Debug log
        return role === 'issuer';
    };

    const isVerifier = () => {
        console.log('Checking isVerifier, current role:', role); // Debug log
        return role === 'verifier';
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{
            user,
            role,
            login,
            logout,
            isIssuer,
            isVerifier,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 