const { StatusCodes } = require("http-status-codes");
const { prisma } = require("../config");
const { loginHandler } = require("../services");

const login = async (req, res) => {
    const { walletAddress, message, signature } = req.body;
    if (!walletAddress || !message || !signature) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const response = await loginHandler({ walletAddress, message, signature });
    console.log("response", response);
    return res.status(200).json({
        success: true,
        message: "Login success",
        error: {},
        data: response,
    });
};

const updateProfile = async (req, res) => {
    try {
        const { walletAddress } = req.user;
        const { name, email } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ success: false, message: "Wallet address tidak ditemukan" });
        }
        const updated = await prisma.user.update({
            where: { walletAddress },
            data: { name, email }
        });
        res.json({ success: true, message: "Profil berhasil diupdate", data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal update profil", error: err.message });
    }
};

const me = async (req, res) => {
    try {
        const { walletAddress } = req.user;
        if (!walletAddress) {
            return res.status(400).json({ success: false, message: "Wallet address tidak ditemukan" });
        }
        const user = await prisma.user.findUnique({
            where: { walletAddress },
            select: {
                name: true,
                email: true,
                role: true,
                walletAddress: true
            }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }
        // If name or email is empty/null, return '-'
        const name = user.name && user.name.trim() !== '' ? user.name : '-';
        const email = user.email && user.email.trim() !== '' ? user.email : '-';
        res.json({
            success: true,
            data: {
                name,
                email,
                role: user.role || 'verifier', // Default to verifier if role is not set
                walletAddress: user.walletAddress
            }
        });
    } catch (err) {
        console.error('Error in /me endpoint:', err);
        res.status(500).json({ success: false, message: "Gagal mengambil data user", error: err.message });
    }
};

// Pengajuan issuer
const createIssuerApplication = async (req, res) => {
    try {
        const { walletAddress } = req.user;
        const { name, email, reason } = req.body;
        if (!name || !email || !reason) {
            return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
        }
        // Cek apakah sudah ada pengajuan PENDING
        const existing = await prisma.issuerApplication.findFirst({
            where: { userId: walletAddress, status: 'PENDING' }
        });
        if (existing) {
            return res.status(400).json({ success: false, message: "Anda sudah memiliki pengajuan yang sedang diproses" });
        }
        const app = await prisma.issuerApplication.create({
            data: {
                userId: walletAddress,
                name,
                email,
                reason,
                status: 'PENDING',
            }
        });
        res.status(201).json({ success: true, data: app });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal mengajukan issuer", error: err.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                walletAddress: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal mengambil data user", error: err.message });
    }
};

const isAdmin = (user) => user.role === 'admin';
const isAdminOrIssuer = (user) => user.role === 'admin' || user.role === 'issuer';

// (ADMIN) Lihat semua pengajuan issuer
const getIssuerApplications = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ success: false, message: "Hanya admin yang dapat mengakses" });
        }
        const apps = await prisma.issuerApplication.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });
        res.json({ success: true, data: apps });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal mengambil data pengajuan", error: err.message });
    }
};

// (ADMIN) Approve pengajuan issuer
const approveIssuerApplication = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ success: false, message: "Hanya admin yang dapat mengakses" });
        }
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: "ID pengajuan wajib" });
        const app = await prisma.issuerApplication.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedBy: req.user.walletAddress,
                reviewedAt: new Date(),
            }
        });
        // Update role user
        await prisma.user.update({
            where: { walletAddress: app.userId },
            data: { role: 'issuer' }
        });
        res.json({ success: true, data: app });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal approve pengajuan", error: err.message });
    }
};

// (ADMIN) Reject pengajuan issuer
const rejectIssuerApplication = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ success: false, message: "Hanya admin yang dapat mengakses" });
        }
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, message: "ID pengajuan wajib" });
        const app = await prisma.issuerApplication.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reviewedBy: req.user.walletAddress,
                reviewedAt: new Date(),
            }
        });
        res.json({ success: true, data: app });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal reject pengajuan", error: err.message });
    }
};

// Cek status pengajuan issuer milik user login
const getMyIssuerApplicationStatus = async (req, res) => {
    try {
        const { walletAddress } = req.user;
        const app = await prisma.issuerApplication.findFirst({
            where: { userId: walletAddress },
            orderBy: { createdAt: 'desc' }
        });
        if (!app) {
            return res.json({ success: true, status: null });
        }
        return res.json({ success: true, status: app.status, data: app });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal mengambil status pengajuan", error: err.message });
    }
};

module.exports = {
    login,
    updateProfile,
    me,
    createIssuerApplication,
    getIssuerApplications,
    approveIssuerApplication,
    rejectIssuerApplication,
    getMyIssuerApplicationStatus,
    getAllUsers,
};
