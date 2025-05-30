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


module.exports = {
    login,
};
