const pinataSDK = require('@pinata/sdk');
const { Readable } = require('stream');
const FormData = require('form-data');

class PinataStorageClient {
    static #instance = null;
    #pinata = null;
    #initialized = false;
    #retryAttempts = 3;
    #retryDelay = 1000; // 1 second

    constructor() {
        if (PinataStorageClient.#instance) {
            throw new Error("Use PinataStorageClient.getInstance() to get the singleton instance");
        }
    }

    static getInstance() {
        if (!PinataStorageClient.#instance) {
            PinataStorageClient.#instance = new PinataStorageClient();
        }
        return PinataStorageClient.#instance;
    }

    async initialize() {
        if (this.#initialized) {
            return;
        }

        try {
            const apiKey = process.env.PINATA_API_KEY;
            const apiSecret = process.env.PINATA_API_SECRET;

            if (!apiKey || !apiSecret) {
                throw new Error('Pinata API credentials not found in environment variables');
            }

            this.#pinata = new pinataSDK(apiKey, apiSecret);

            // Test connection
            const test = await this.#pinata.testAuthentication();
            if (!test.authenticated) {
                throw new Error('Failed to authenticate with Pinata');
            }

            this.#initialized = true;
            console.log('✅ Pinata client initialized');
        } catch (error) {
            console.error('Failed to initialize Pinata client:', error);
            throw error;
        }
    }

    async uploadFile(fileBuffer, fileName, mimeType) {
        if (!this.#pinata || !this.#initialized) {
            throw new Error("Client not initialized. Call initialize() first.");
        }

        console.log('Uploading file:', fileName);

        let attempt = 0;
        while (attempt < this.#retryAttempts) {
            try {
                // Create a readable stream from the buffer
                const stream = Readable.from(fileBuffer);

                const options = {
                    pinataMetadata: {
                        name: fileName,
                    },
                    pinataOptions: {
                        cidVersion: 0
                    }
                };

                const result = await this.#pinata.pinFileToIPFS(stream, options);
                const cid = result.IpfsHash;
                console.log('File uploaded successfully with CID:', cid);
                return cid;
            } catch (error) {
                attempt++;
                console.error(`Upload attempt ${attempt} failed:`, error);

                if (attempt === this.#retryAttempts) {
                    throw new Error(`Failed to upload file after ${this.#retryAttempts} attempts: ${error.message}`);
                }

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.#retryDelay * attempt));
            }
        }
    }

    async uploadLargeFile(fileBuffer, fileName, mimeType) {
        if (!this.#pinata || !this.#initialized) {
            throw new Error("Client not initialized. Call initialize() first.");
        }

        console.log('Uploading large file:', fileName);

        try {
            // Create a readable stream from the buffer
            const stream = Readable.from(fileBuffer);

            const options = {
                pinataMetadata: {
                    name: fileName,
                },
                pinataOptions: {
                    cidVersion: 0
                }
            };

            const result = await this.#pinata.pinFileToIPFS(stream, options);
            const cid = result.IpfsHash;
            console.log('Large file uploaded successfully with CID:', cid);
            return cid;
        } catch (error) {
            console.error('Failed to upload large file:', error);
            throw error;
        }
    }

    async getFileUrl(cid) {
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }
}

module.exports = PinataStorageClient;