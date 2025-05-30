import React from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const Testing = () => {
  const downloadPDF = async () => {
    try {
      // Panggil API untuk generate PDF
      const response = await axios.get('http://localhost:5000/api/certificate/create', {
        responseType: 'arraybuffer',  // Pastikan response berupa buffer
      });

      // Cek apakah responsenya ada
      if (response.data) {
        // Menggunakan FileSaver untuk mendownload PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        saveAs(blob, 'certificate.pdf');  // Nama file PDF yang akan diunduh
      }
    } catch (error) {
      console.error('Error downloading the certificate:', error);
      alert('Gagal mendownload sertifikat.');
    }
  };

  return (
    <div className="container">
      <button onClick={downloadPDF} className="px-6 py-3 bg-blue-500 text-white rounded-lg">
        Download Sertifikat
      </button>
    </div>
  );
};

export default Testing;
