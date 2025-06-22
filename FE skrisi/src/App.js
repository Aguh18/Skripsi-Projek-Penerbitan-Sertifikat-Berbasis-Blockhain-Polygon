import React, { useEffect } from 'react';
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

function App() {
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
  }, []);

  return (
    <WalletProvider>
      <AuthProvider>
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
      </AuthProvider>
    </WalletProvider>
  );
}

export default App;
