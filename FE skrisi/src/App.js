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
  useNavigate
} from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
    <AuthProvider>
      <Router>
        <div className="animate-fade-in">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes for all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Root />}>
                <Route path="/dashboard" index element={<Dashboard />} />
                <Route path="activity-log" element={<History />} />
                <Route path="settings" element={<Settings />} />
                <Route path="certificates" element={<Certificates />} />
              </Route>
            </Route>

            {/* Protected routes for issuers and verifiers */}
            <Route element={<ProtectedRoute allowedRoles={['issuer_or_verifier']} />}>
              <Route path="/" element={<Root />}>
                <Route path="verify-certificate" element={<VerifyCertificate />} />
              </Route>
            </Route>

            {/* Protected routes for issuers only */}
            <Route element={<ProtectedRoute allowedRoles={['issuer']} />}>
              <Route path="/" element={<Root />}>
                <Route path="issue-certificate" element={<IssueCertificate />} />
                <Route path="issue-certificate/submit" element={<Submit />} />
                <Route path="template" element={<Templates />} />
                <Route path="upload-template" element={<UploadCert />} />
              </Route>
            </Route>
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
  );
}

export default App;
