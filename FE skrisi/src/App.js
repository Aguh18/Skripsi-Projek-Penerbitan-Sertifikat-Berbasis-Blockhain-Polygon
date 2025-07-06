import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import "aos/dist/aos.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';
import ProfileGuard from './components/ProfileGuard';
import ProtectedRoute from './components/ProtectedRoute';
import { WalletProvider } from './context/WalletContext';
// All pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Root from './pages/Root';
import IssueCertificate from './pages/IssueCertificate';
import Submit from './pages/Submit';
import VerifyCertificate from './pages/VerifyCertificate';
import UploadCert from './pages/UploadCert';
import Settings from './pages/Settings';
import History from './pages/History';
import Certificates from './pages/Certificates';
import Templates from './pages/Templates';
import CreateCertificate from './pages/CreateCertificate';
import Unauthorized from './pages/Unauthorized';
import LandingPage from './pages/LandingPage';
import DraftCertificates from './pages/DraftCertificates';
import PublishCertificate from './pages/PublishCertificate';
import Users from './pages/Users';
import IssuerApprovals from './pages/IssuerApprovals';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000'
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// LoadingScreen component
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Nebula/gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(white,rgba(255,255,255,.08)_2px,transparent_40px)] bg-[length:50px_50px] opacity-20"></div>
      </div>
      {/* Spinner */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent border-b-purple-500 border-l-pink-500 rounded-full animate-spin mb-8 shadow-2xl"></div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-widest animate-fade-in">certchain</h1>
        <p className="text-lg text-blue-200 animate-fade-in-slow">Loading platform blockchain...</p>
      </div>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const aos_init = () => {
      AOS.init({
        once: true,
        duration: 1000,
        easing: 'ease-out-cubic',
      });
    }
    window.addEventListener('load', () => {
      aos_init();
    });
    // Loading screen timeout
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <WalletProvider>
      <AuthProvider>
        <ProfileGuard>
          <Router>
            <div className="animate-fade-in">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Root />}>
                    <Route index element={<Dashboard />} />
                    <Route path="activity-log" element={<History />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="certificates" element={<Certificates />} />

                    {/* Admin only route for user management */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                      <Route path="users" element={<Users />} />
                      <Route path="issuer-approvals" element={<IssuerApprovals />} />
                    </Route>

                    {/* Routes for issuers and verifiers */}
                    <Route element={<ProtectedRoute allowedRoles={['issuer_or_verifier']} />}>
                      <Route path="verify-certificate" element={<VerifyCertificate />} />
                    </Route>

                    {/* Routes for issuers only */}
                    <Route element={<ProtectedRoute allowedRoles={['issuer']} />}>
                      <Route path="issue-certificate" element={<IssueCertificate />} />
                      <Route path="issue-certificate/submit/:id" element={<Submit />} />
                      <Route path="template" element={<Templates />} />
                      <Route path="upload-template" element={<UploadCert />} />
                    </Route>
                  </Route>
                </Route>

                {/* Catch all route - redirect to dashboard if authenticated, otherwise to login */}
                <Route path="*" element={<Navigate to="/" replace />} />

                {/* Additional route for DraftCertificates */}
                <Route path="/certificates/drafts" element={<DraftCertificates />} />

                {/* Additional route for PublishCertificate */}
                <Route path="/certificates/:id/publish" element={<PublishCertificate />} />
              </Routes>
            </div>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </Router>
        </ProfileGuard>
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;
