import React from 'react';
import { useAuth } from '../context/AuthContext';

const CreateCertificate = () => {
    const { isIssuer } = useAuth();

    if (!isIssuer()) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Create New Certificate</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
                {/* Add your certificate creation form here */}
                <p className="text-gray-600">Certificate creation form will be implemented here.</p>
            </div>
        </div>
    );
};

export default CreateCertificate; 