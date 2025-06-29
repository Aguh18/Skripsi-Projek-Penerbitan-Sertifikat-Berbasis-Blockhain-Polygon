/**
 * Utility functions untuk standardisasi penanganan tanggal
 */

/**
 * Validasi format tanggal (YYYY-MM-DD)
 * @param {string} dateString - String tanggal dalam format YYYY-MM-DD
 * @returns {boolean} - True jika valid
 */
const isValidDateFormat = (dateString) => {
    if (!dateString) return false;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
};

/**
 * Konversi string tanggal ke Date object dengan validasi
 * @param {string} dateString - String tanggal dalam format YYYY-MM-DD
 * @returns {Date|null} - Date object atau null jika invalid
 */
const parseDate = (dateString) => {
    if (!dateString) return null;

    if (!isValidDateFormat(dateString)) {
        throw new Error(`Invalid date format: ${dateString}. Expected format: YYYY-MM-DD`);
    }

    return new Date(dateString + 'T00:00:00.000Z');
};

/**
 * Format tanggal untuk display (DD/MM/YYYY)
 * @param {Date|string} date - Date object atau string tanggal
 * @returns {string} - Tanggal dalam format DD/MM/YYYY
 */
const formatDateForDisplay = (date) => {
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
 * Format tanggal untuk database (YYYY-MM-DD)
 * @param {Date|string} date - Date object atau string tanggal
 * @returns {string} - Tanggal dalam format YYYY-MM-DD
 */
const formatDateForDatabase = (date) => {
    if (!date) return null;

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for database:', error);
        return null;
    }
};

/**
 * Validasi expiry date terhadap issue date
 * @param {string} expiryDate - Tanggal kadaluarsa
 * @param {string} issueDate - Tanggal penerbitan
 * @returns {boolean} - True jika valid
 */
const isValidExpiryDate = (expiryDate, issueDate) => {
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
const isExpired = (expiryDate) => {
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

module.exports = {
    isValidDateFormat,
    parseDate,
    formatDateForDisplay,
    formatDateForDatabase,
    isValidExpiryDate,
    isExpired
}; 