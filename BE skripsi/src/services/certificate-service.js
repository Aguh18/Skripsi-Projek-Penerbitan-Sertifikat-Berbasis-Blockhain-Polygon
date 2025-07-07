import puppeteer from 'puppeteer';
import fs from 'fs';
import fss from 'fs/promises';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { keccak256 } from 'ethers';
import { prisma } from '../config/database.js';
import Web3StorageClient from '../config/storage.js';
import { decodeToken } from '../utils/jwt.js';
import { decode } from 'punycode';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = path.join(__dirname, '../certificates');
console.log('Output directory:', outputDir);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Folder created: ${outputDir}`);
}

async function generateCertificate(params) {
    const {
        recipientName,
        issueDate,
        certificateTitle,
        description,
        category,
        targetAddress
    } = params;

    if (!recipientName || !issueDate || !certificateTitle || !description ||
        !category || !targetAddress) {
        const missingFields = [
            !recipientName && 'recipientName',
            !issueDate && 'issueDate',
            !certificateTitle && 'certificateTitle',
            !description && 'description',
            !category && 'category',
            !targetAddress && 'targetAddress'
        ].filter(Boolean);
        throw new Error(`Semua field wajib diisi. Missing: ${missingFields.join(', ')}`);
    }
    const cleanData = {
        recipientName: recipientName.replace(/"/g, ''),
        issueDate: issueDate.replace(/"/g, ''),
        certificateTitle: certificateTitle.replace(/"/g, ''),
        description: description.replace(/"/g, ''),
        category: category.replace(/"/g, ''),
        targetAddress
    };
    const certificateHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sertifikat Kelulusan</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background-color: #f3f4f6;
                }
                .certificate {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
                    max-width: 600px;
                    text-align: center;
                }
                .certificate h1 {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .certificate p {
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                .certificate .name {
                    font-size: 22px;
                    font-weight: bold;
                    color: #007bff;
                }
                .certificate .date {
                    font-size: 18px;
                    font-style: italic;
                }
                .certificate .description {
                    font-size: 16px;
                }
                .certificate .category {
                    font-size: 16px;
                }
                .certificate .targetAddress {
                    font-size: 14px;
                    word-break: break-all;
                }
                .verify-btn {
                    display: inline-block;
                    margin-top: 15px;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <div class="certificate">
                <h1 id="certificateTitle">${cleanData.certificateTitle}</h1>
                <p>Dengan ini menyatakan bahwa</p>
                <p class="name" id="recipientName">${cleanData.recipientName}</p>
                <p>Telah berhasil menyelesaikan program pendidikan dan memperoleh kelulusan pada tanggal:</p>
                <p class="date" id="issueDate">${cleanData.issueDate}</p>
                <p class="description" id="description">${cleanData.description}</p>
                <p class="category" id="category">${cleanData.category}</p>
                <p class="targetAddress" id="targetAddress">${cleanData.targetAddress}</p>
                <a href="#" class="verify-btn">Verifikasi Sertifikat</a>
            </div>
        </body>
        </html>
    `;

    try {

        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();


        await page.setContent(certificateHtml, { waitUntil: 'load' });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `certificate_${cleanData.recipientName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
        const filePath = path.join(outputDir, fileName);

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true
        });

        const pdfBuffer = fs.readFileSync(filePath);
        const certificateId = keccak256(pdfBuffer);


        await browser.close();
        return {
            message: 'Certificate generated successfully',
            filePath: fileName,
            id: certificateId,

        };

    } catch (err) {
        console.error(err);
        throw new Error('Error generating certificate: ' + err.message);
    }
}

async function uploadTemplate(req) {
    // Validate req.file
    if (!req.file) {
        throw new Error('No file uploaded');
    }


    const userData = decodeToken(req.headers.authorization);

    if (!userData?.walletAddress) {
        throw new Error('Invalid token: walletAddress is missing');
    }

    let cid, filePath, fileName;

    try {
        const web3Client = Web3StorageClient.getInstance();
        await web3Client.initialize();

        const uploadDir = path.join(__dirname, '..', 'certificates', 'templates');
        console.log('Upload directory:', uploadDir);
        await fss.mkdir(uploadDir, { recursive: true });
        fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
        filePath = path.join(uploadDir, fileName);
        await fss.writeFile(filePath, req.file.buffer);
        console.log('File saved to:', filePath);

        const fileContent = await fss.readFile(filePath);
        const file = new File([fileContent], fileName, { type: req.file.mimetype });

        cid = await web3Client.uploadFile(file);

        await fss.unlink(filePath);
    } catch (err) {
        console.error('Error uploading file:', err);
        throw new Error('Error uploading file: ' + err.message);
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.template.create({
                data: {
                    user: {
                        connect: { walletAddress: userData.walletAddress }, // Connect user relation
                    },
                    name: req.body.templateName,
                    filePath: `https://${cid}.ipfs.w3s.link/${fileName}`,
                    nameX: parseFloat(req.body.positionX), // Convert to Float
                    nameY: parseFloat(req.body.positionY), // Handle nullable nameY
                },
            });
        });
    } catch (dbErr) {
        console.error('Database error:', dbErr);
        throw new Error('Database error: ' + dbErr.message);
    }

    return {
        cid,
        filePath,
    };
}


async function verifyCertificate() {
    try {
        // Fetch the file as a stream
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer', // For binary files like PDFs
        });


        // Define the output directory and file path
        const outputDir = "/home/aguhh/Documents/Skripsweet/BE skripsi/src/certificates/downloads";
        const fileName = `certificate_${Date.now()}.pdf`; // Unique file name to avoid overwriting
        const filePath = path.join(outputDir, fileName); // Combine directory and file name

        // Ensure the directory exists
        await fss.mkdir(outputDir, { recursive: true });

        // Save the file
        await fss.writeFile(filePath, Buffer.from(response.data));
        console.log(`File downloaded and saved to ${filePath}`);
    } catch (error) {
        console.error('Error downloading file:', error.message);
        throw error; // Re-throw for upstream handling
    }
    const pdfBuffe = fs.readFileSync(filePath);

    // Hitung hash keccak256 dari konten PDF
    const certificateId = keccak256(pdfBuffe);
    console.log('Certificate ID (hash):', certificateId);

}

async function getTemplate(req) {
    const userId = decodeToken(req.headers.authorization).walletAddress;
    try {
        const templates = await prisma.template.findMany({
            where: {
                userId: userId,
                isDeleted: false // Hanya ambil template yang belum dihapus
            },
        });

        if (!templates) {
            console.log('Template not found');
            throw new Error('Template not found');
        }

        return templates

    } catch (error) {
        throw new Error('Error fetching template: ' + error.message);
    }
}

async function downloadFromIPFS(url, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`📥 Debug: Downloading from IPFS attempt ${i + 1}/${maxRetries}`);
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'Accept': 'image/png,image/jpeg,image/*,*/*'
                }
            });
            return response.data;
        } catch (error) {
            console.error(`❌ Debug: Download attempt ${i + 1} failed:`, error.message);
            lastError = error;
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000; // Exponential backoff
                console.log(`⏳ Debug: Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`Failed to download from IPFS after ${maxRetries} attempts: ${lastError.message}`);
}

async function generateCertificateFromTemplate(params) {
    const {
        template,
        certificateNumber,
        recipientName,
        certificateTitle,
        issueDate,
        expiryDate,
        description,
        category,
        targetAddress,
        issuerName,
        issuerAddress
    } = params;

    let browser;
    try {
        // Download template from IPFS with retry mechanism
        const templateUrl = template.filePath;
        console.log('🔍 Debug: Template URL:', templateUrl);

        const imageData = await downloadFromIPFS(templateUrl);
        console.log('✅ Debug: Template downloaded successfully');

        // Get image dimensions using sharp
        const imageInfo = await sharp(Buffer.from(imageData)).metadata();
        const templateWidth = imageInfo.width;
        const templateHeight = imageInfo.height;
        console.log('📐 Debug: Template dimensions:', { width: templateWidth, height: templateHeight });
        console.log('📍 Debug: Name position:', { x: template.nameX, y: template.nameY });

        // Create HTML with the image template
        const templateHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: transparent;
                    }
                    .certificate-container {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .certificate-image {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        display: block;
                    }
                    .certificate-content {
                        position: absolute;
                        width: 100%;
                        height: 100%;
                        top: 0;
                        left: 0;
                    }
                    .recipient-name {
                        position: absolute;
                        left: calc(${template.nameX}% + 5%);
                        top: calc(${template.nameY}% + 5%);
                        transform: translate(-50%, -50%);
                        font-size: 40px;
                        font-weight: bold;
                        color: #000;
                        text-align: center;
                        width: max-content;
                        min-width: 120px;
                        white-space: nowrap;
                        pointer-events: none;
                        font-family: 'Arial', sans-serif;
                        text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
                        background-color: rgba(255, 255, 255, 0.5);
                        padding: 8px 16px;
                        border-radius: 4px;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <img class="certificate-image" src="data:image/png;base64,${Buffer.from(imageData).toString('base64')}" />
                    <div class="certificate-content">
                        <div class="recipient-name">${recipientName}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Generate PDF using Puppeteer with increased timeout
        console.log('🔄 Debug: Launching Puppeteer');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
            timeout: 120000
        });

        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(120000);
        await page.setDefaultTimeout(120000);

        // Set viewport to match template dimensions
        await page.setViewport({
            width: templateWidth,
            height: templateHeight,
            deviceScaleFactor: 1,
        });

        console.log('🔄 Debug: Setting page content');
        await page.setContent(templateHtml, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 120000
        });

        // Wait for image to load
        console.log('🔄 Debug: Waiting for image to load');
        await page.waitForSelector('.certificate-image', { timeout: 120000 });
        await page.waitForFunction(
            () => {
                const img = document.querySelector('.certificate-image');
                return img && img.complete && img.naturalHeight !== 0;
            },
            { timeout: 120000 }
        );

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `certificate_${recipientName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
        const filePath = path.join(outputDir, fileName);

        console.log('🔄 Debug: Generating PDF');
        await page.pdf({
            path: filePath,
            width: `${templateWidth}px`,
            height: `${templateHeight}px`,
            printBackground: true,
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            preferCSSPageSize: true,
            timeout: 120000
        });

        const pdfBuffer = fs.readFileSync(filePath);
        const certificateId = keccak256(pdfBuffer);

        console.log('✅ Debug: PDF generated successfully');

        return {
            message: 'Certificate generated successfully',
            filePath: fileName,
            id: certificateId,
            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${certificateId}`
        };

    } catch (err) {
        console.error('❌ Debug: Error in generateCertificateFromTemplate:', err);
        throw new Error('Error generating certificate from template: ' + err.message);
    } finally {
        if (browser) {
            console.log('🔄 Debug: Closing browser');
            await browser.close();
        }
    }
}

const deleteTemplate = async (templateId, walletAddress) => {
    try {
        const template = await prisma.template.findFirst({
            where: {
                id: templateId,
                userId: walletAddress,
                isDeleted: false
            }
        });

        if (!template) {
            throw new Error('Template tidak ditemukan');
        }

        await prisma.template.update({
            where: {
                id: templateId
            },
            data: {
                isDeleted: true
            }
        });

        return { success: true, message: 'Template berhasil dihapus' };
    } catch (error) {
        console.error('Error in deleteTemplate:', error);
        throw error;
    }
};

export {
    generateCertificate,
    uploadTemplate,
    verifyCertificate,
    getTemplate,
    generateCertificateFromTemplate,
    deleteTemplate
}; export default generateCertificate;
