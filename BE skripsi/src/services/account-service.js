// src/services/account-service.js
const { email } = require("@web3-storage/w3up-client/types");
const { generateToken } = require("../utils");
const { ethers } = require("ethers");
const { prisma } = require("../config/index");

async function loginHandler(credentials) {


    const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);

    if (recoveredAddress.toLocaleLowerCase() !== credentials.walletAddress.toLocaleLowerCase()) {
        throw new Error("error does not match");
    }

    const token = generateToken({ walletAddress: credentials.walletAddress });

    const user = await prisma.user.findUnique({
        where: {
            walletAddress: credentials.walletAddress
        }
    });
    if (!user) {

        newUser = await prisma.user.create({
            data: {
                walletAddress: credentials.walletAddress,

            }
        });
        if (!newUser) {
            throw new Error("Failed to create new user");
        }
        console.log("User created successfully");
    }
    return {
        token: token,
        user: {
            id: 1,
            email: email
        }
    };
}

module.exports = loginHandler; 
