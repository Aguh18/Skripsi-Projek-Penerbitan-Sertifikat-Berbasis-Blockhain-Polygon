const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const walletAddress = req.user.walletAddress;
            const user = await prisma.user.findUnique({
                where: { walletAddress }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

module.exports = {
    checkRole
}; 