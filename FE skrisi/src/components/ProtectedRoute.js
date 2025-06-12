import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isIssuer, isVerifier } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        const hasRequiredRole = allowedRoles.some(role => {
            if (role === 'issuer') return isIssuer();
            if (role === 'verifier') return isVerifier();
            if (role === 'issuer_or_verifier') return isIssuer() || isVerifier();
            return false;
        });

        if (!hasRequiredRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute; 