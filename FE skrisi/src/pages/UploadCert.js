import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import Draggable from 'react-draggable';
import axios from 'axios';
import { getEnv } from '../utils/env';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900 p-8 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-lg font-medium">Mengunggah Template...</p>
        </div>
    </div>
);

const UploadCert = () => {
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [name, setName] = useState('Name');
    const [namePosition, setNamePosition] = useState({ x: 50, y: 50 });
    const [activeField, setActiveField] = useState(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [certificateName, setCertificateName] = useState('');
    const [templateFile, setTemplateFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showGrid, setShowGrid] = useState(false);

    const previewRef = useRef(null);
    const containerRef = useRef(null);

    const handleSubmit = async (e) => {
        if (!template) {
            toast.error('Silakan unggah template sertifikat terlebih dahulu.');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();

        formData.append('template', templateFile);
        formData.append('templateName', certificateName);
        formData.append('positionX', namePosition.x);
        formData.append('positionY', namePosition.y);

        try {
            const response = await axios.post(getEnv('BASE_URL') + '/api/certificate/upload-template', formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                toast.success('Template berhasil diunggah!', {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    style: {
                        background: '#1F2937',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '500',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }
                });
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error('Error uploading template:', error);
            toast.error('Gagal mengunggah template. Silakan coba lagi.', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                style: {
                    background: '#1F2937',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: '500',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    // Set fixed dimensions for preview
                    const maxWidth = 800;
                    const maxHeight = 600;
                    let width = img.width;
                    let height = img.height;

                    // Calculate aspect ratio
                    const aspectRatio = width / height;

                    if (width > maxWidth) {
                        width = maxWidth;
                        height = width / aspectRatio;
                    }

                    if (height > maxHeight) {
                        height = maxHeight;
                        width = height * aspectRatio;
                    }

                    setImageSize({ width, height });
                    setTemplate(reader.result);
                    setTemplateFile(file);
                    // Reset name position to center when new template is uploaded
                    setNamePosition({ x: 50, y: 50 });
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        } else {
            alert('Harap unggah file gambar (PNG/JPG)');
        }
    };

    const handleDrag = (field, e, data) => {
        if (!previewRef.current) return;

        const container = previewRef.current.getBoundingClientRect();
        // Calculate position as percentage of container dimensions
        const x = (data.x / container.width) * 100;
        const y = (data.y / container.height) * 100;

        if (field === 'name') {
            setNamePosition({ x, y });
        }
    };

    const renderGrid = () => {
        if (!imageSize.width || !imageSize.height) return null;
        const lines = [];
        for (let i = 1; i < 10; i++) {
            // Vertical lines
            lines.push(
                <div
                    key={`v-${i}`}
                    style={{
                        position: 'absolute',
                        left: `${i * 10}%`,
                        top: 0,
                        width: '1px',
                        height: '100%',
                        background: 'rgba(0,0,0,0.15)',
                        zIndex: 20
                    }}
                />
            );
            // Horizontal lines
            lines.push(
                <div
                    key={`h-${i}`}
                    style={{
                        position: 'absolute',
                        top: `${i * 10}%`,
                        left: 0,
                        width: '100%',
                        height: '1px',
                        background: 'rgba(0,0,0,0.15)',
                        zIndex: 20
                    }}
                />
            );
        }
        return lines;
    };

    return (
        <div className="animate-fade-in">
            {isLoading && <LoadingOverlay />}
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gradient">Upload Template Sertifikat</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <div className="card space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Unggah Template Sertifikat (PNG/JPG)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleTemplateUpload}
                                className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nama Sertifikat</label>
                            <input
                                type="text"
                                value={certificateName}
                                onChange={(e) => setCertificateName(e.target.value)}
                                className="input-field"
                                placeholder="Masukkan Nama Sertifikat"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nama Peserta</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="Masukkan nama peserta"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveField('name')}
                                className={`flex-1 btn-secondary ${activeField === 'name' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}`}
                                disabled={!template}
                            >
                                Geser Nama
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowGrid((prev) => !prev)}
                                className="flex-1 btn-secondary"
                                disabled={!template}
                            >
                                {showGrid ? 'Sembunyikan Grid' : 'Tampilkan Grid'}
                            </button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="card">
                        <h2 className="text-lg font-semibold text-gray-300 mb-4">Pratinjau Sertifikat</h2>
                        <div
                            ref={containerRef}
                            className="relative max-w-full max-h-[70vh] overflow-auto mx-auto rounded-lg border border-gray-700/30"
                        >
                            <div
                                ref={previewRef}
                                className="relative"
                                style={{
                                    width: `${imageSize.width}px`,
                                    height: `${imageSize.height}px`,
                                    minWidth: `${imageSize.width}px`,
                                    minHeight: `${imageSize.height}px`,
                                }}
                            >
                                {template ? (
                                    <div className="relative w-full h-full">
                                        <img
                                            src={template}
                                            alt="Template Sertifikat"
                                            className="w-full h-full object-contain"
                                        />
                                        {showGrid && renderGrid()}
                                        <div className="absolute inset-0">
                                            <Draggable
                                                disabled={activeField !== 'name'}
                                                onDrag={(e, data) => handleDrag('name', e, data)}
                                                position={{
                                                    x: (namePosition.x / 100) * (previewRef.current?.offsetWidth || 0),
                                                    y: (namePosition.y / 100) * (previewRef.current?.offsetHeight || 0),
                                                }}
                                                bounds="parent"
                                            >
                                                <div
                                                    className="absolute flex items-center justify-center cursor-move"
                                                    style={{
                                                        transform: 'translate(-50%, -50%)',
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <p className="text-2xl font-bold text-black bg-white/50 px-4 py-2 rounded">
                                                        {name || 'Nama Peserta'}
                                                    </p>
                                                </div>
                                            </Draggable>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-gray-400">
                                            Unggah template untuk melihat pratinjau
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-6 space-x-4">
                    <button
                        onClick={handleSubmit}
                        className="btn-primary relative"
                        disabled={!template || !certificateName || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="opacity-0">Simpan Template</span>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </>
                        ) : (
                            'Simpan Template'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadCert;
