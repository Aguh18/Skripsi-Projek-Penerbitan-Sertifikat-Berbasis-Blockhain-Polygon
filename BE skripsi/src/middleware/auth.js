const { verifyToken } = require('../utils/jwt');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(authHeader);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
};

const requireIssuer = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(authHeader);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    // Admin dan issuer boleh mengakses
    if (decoded.role !== 'issuer' && decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Issuer or admin role required' });
    }

    req.user = decoded;
    next();
};

module.exports = {
    requireAuth,
    requireIssuer
}; 