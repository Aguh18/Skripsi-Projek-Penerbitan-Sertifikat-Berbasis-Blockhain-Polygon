const { verifyToken, decodeToken } = require('../utils');


const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        if (!verifyToken(token)) {
            return res.status(403).json({ message: "Forbidden: Invalid token" });
        }

        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
};

module.exports = authMiddleware;
