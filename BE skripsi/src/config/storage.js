const Client = require('@web3-storage/w3up-client');
const { Readable } = require('stream');

class Web3StorageClient {
    static #instance = null;
    #client = null;
    #initialized = false;
    #retryAttempts = 3;
    #retryDelay = 1000; // 1 second

    constructor() {
        if (Web3StorageClient.#instance) {
            throw new Error("Use Web3StorageClient.getInstance() to get the singleton instance");
        }
    }

    static getInstance() {
        if (!Web3StorageClient.#instance) {
            Web3StorageClient.#instance = new Web3StorageClient();
        }
        return Web3StorageClient.#instance;
    }

    async initialize() {
        if (this.#initialized) {
            return;
        }

        try {
            this.#client = await Client.create();
            const account = await this.#client.login('teguh180902@gmail.com');
            await this.#client.capability.access.claim();
            await this.#client.setCurrentSpace("did:key:z6MkoK22dFM6G2gww3zD9pncgLpJ9SgtZbGjR1zFkrshehKA");
            this.#initialized = true;
            console.log('✅ Web3.Storage client initialized');
        } catch (error) {
            console.error('Failed to initialize Web3.Storage client:', error);
            throw error;
        }
    }

    async uploadFile(file) {
        if (!this.#client || !this.#initialized) {
            throw new Error("Client not initialized. Call initialize() first.");
        }
        if (!(file instanceof File)) {
            throw new Error("Invalid file object provided");
        }

        console.log('Uploading file:', file.name);

        // Convert file to stream for chunked upload
        const fileStream = Readable.from(file.stream());

        let attempt = 0;
        while (attempt < this.#retryAttempts) {
            try {
                const root = await this.#client.uploadDirectory([file], {
                    onRootCidReady: (cid) => {
                        console.log('Upload started, CID:', cid);
                    },
                    onStoredChunk: (size) => {
                        console.log(`Stored chunk of ${size} bytes`);
                    }
                });

                const cid = root.toString();
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

    async uploadLargeFile(file, chunkSize = 1024 * 1024) { // 1MB chunks
        if (!this.#client || !this.#initialized) {
            throw new Error("Client not initialized. Call initialize() first.");
        }
        if (!(file instanceof File)) {
            throw new Error("Invalid file object provided");
        }

        console.log('Uploading large file:', file.name);

        const totalChunks = Math.ceil(file.size / chunkSize);
        let uploadedChunks = 0;

        try {
            const root = await this.#client.uploadDirectory([file], {
                onRootCidReady: (cid) => {
                    console.log('Upload started, CID:', cid);
                },
                onStoredChunk: (size) => {
                    uploadedChunks++;
                    const progress = (uploadedChunks / totalChunks) * 100;
                    console.log(`Upload progress: ${progress.toFixed(2)}%`);
                }
            });

            const cid = root.toString();
            console.log('Large file uploaded successfully with CID:', cid);
            return cid;
        } catch (error) {
            console.error('Failed to upload large file:', error);
            throw error;
        }
    }
}

module.exports = Web3StorageClient;