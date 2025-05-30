const jwt = require("jsonwebtoken");
const { token } = require("morgan");
require("dotenv").config();

const secret = process.env.JWT_SECRET || "default_secret";
const expiresIn = process.env.JWT_EXPIRES_IN || "12h";

const generateToken = (payload) => {


    return jwt.sign(payload, secret, { expiresIn });
};


const verifyToken = (token) => {
    try {
        let Cleantoken = token.split(' ')[1];

        return jwt.verify(Cleantoken, secret);

    } catch (error) {
        return null;
    }
};

const decodeToken = (token) => {
    let Cleantoken = token.split(' ')[1];
    return jwt.decode(Cleantoken, { complete: true }).payload;
}

module.exports = { generateToken, verifyToken, decodeToken };
