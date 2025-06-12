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

    let user = await prisma.user.findUnique({
        where: {
            walletAddress: credentials.walletAddress
        },
        select: {
            walletAddress: true,
            name: true,
            email: true,
            role: true
        }
    });

    console.log('Found user:', user); // Debug log

    if (!user) {
        user = await prisma.user.create({
            data: {
                walletAddress: credentials.walletAddress,
                role: 'verifier' // Default role for new users
            },
            select: {
                walletAddress: true,
                name: true,
                email: true,
                role: true
            }
        });

        if (!user) {
            throw new Error("Failed to create new user");
        }
        console.log("New user created:", user); // Debug log
    }

    // Generate token with role included
    const token = generateToken({
        walletAddress: credentials.walletAddress,
        role: user.role || 'verifier'
    });

    const responseData = {
        token: token,
        user: {
            walletAddress: user.walletAddress,
            name: user.name || '-',
            email: user.email || '-',
            role: user.role || 'verifier'
        }
    };

    console.log('Login response data:', responseData); // Debug log
    return responseData;
}

module.exports = loginHandler; 
