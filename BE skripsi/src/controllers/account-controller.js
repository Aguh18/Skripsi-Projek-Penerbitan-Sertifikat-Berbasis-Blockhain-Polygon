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

module.exports = {
    login,
    updateProfile,
    me,
};
