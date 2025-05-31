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
import ProtectedRoute from './components/ProtectedRoute';

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
    <main className="min-h-screen bg-gray-50">
      <Router>
        <div className="animate-fade-in">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Root />}>
                <Route path="/dashboard" index element={<Dashboard />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="issue-certificate" element={<IssueCertificate />} />
                <Route path="issue-certificate/submit" element={<Submit />} />
                <Route path="template" element={<Templates />} />
                <Route path="upload-template" element={<UploadCert />} />
                <Route path="verify-certificate" element={<VerifyCertificate />} />
                <Route path="activity-log" element={<History />} />
                <Route path="settings" element={<Settings />} />
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
    </main>
  );
}

export default App;
