/**
 * Utility functions untuk standardisasi penanganan tanggal di frontend
 */

/**
 * Validasi format tanggal (YYYY-MM-DD)
 * @param {string} dateString - String tanggal dalam format YYYY-MM-DD
 * @returns {boolean} - True jika valid
 */
export const isValidDateFormat = (dateString) => {
    if (!dateString) return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
};

/**
 * Format tanggal untuk display (DD/MM/YYYY)
 * @param {Date|string} date - Date object atau string tanggal
 * @returns {string} - Tanggal dalam format DD/MM/YYYY
 */
export const formatDateForDisplay = (date) => {
    if (!date) return '-';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
};

/**
 * Format tanggal untuk input field (YYYY-MM-DD)
 * @param {Date|string} date - Date object atau string tanggal
 * @returns {string} - Tanggal dalam format YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
    }
};

/**
 * Validasi expiry date terhadap issue date
 * @param {string} expiryDate - Tanggal kadaluarsa
 * @param {string} issueDate - Tanggal penerbitan
 * @returns {boolean} - True jika valid
 */
export const isValidExpiryDate = (expiryDate, issueDate) => {
    if (!expiryDate) return true; // Expiry date optional

    if (!isValidDateFormat(expiryDate) || !isValidDateFormat(issueDate)) {
        return false;
    }

    const expiry = new Date(expiryDate);
    const issue = new Date(issueDate);

    return expiry > issue;
};

/**
 * Cek apakah sertifikat sudah expired
 * @param {Date|string} expiryDate - Tanggal kadaluarsa
 * @returns {boolean} - True jika sudah expired
 */
export const isExpired = (expiryDate) => {
    if (!expiryDate) return false; // Tidak ada expiry date = tidak expired

    try {
        const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
        const now = new Date();

        return expiry < now;
    } catch (error) {
        console.error('Error checking expiry:', error);
        return false;
    }
};

/**
 * Dapatkan status sertifikat berdasarkan expiry date
 * @param {Date|string} expiryDate - Tanggal kadaluarsa
 * @param {string} status - Status sertifikat dari database
 * @returns {string} - Status sertifikat (active, expired, revoked)
 */
export const getCertificateStatus = (expiryDate, status = 'active') => {
    if (status === 'revoked') return 'revoked';
    if (isExpired(expiryDate)) return 'expired';
    return 'active';
};

/**
 * Dapatkan warna untuk status sertifikat
 * @param {string} status - Status sertifikat
 * @returns {string} - Class warna Tailwind CSS
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'active':
            return 'text-green-400 bg-green-400/10 border-green-400/20';
        case 'expired':
            return 'text-red-400 bg-red-400/10 border-red-400/20';
        case 'revoked':
            return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        default:
            return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
}; 