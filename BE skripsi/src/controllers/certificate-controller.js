const puppeteer = require('puppeteer');
const axios = require('axios');
const { StatusCodes } = require('http-status-codes');
const Client = require('@web3-storage/w3up-client').default
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { default: generateCertificate, uploadTemplate, getTemplate, generateCertificateFromTemplate } = require('../services/certificate-service');
const Web3StorageClient = require('../config/storage');
const { keccak256 } = require('ethers');
const fss = require('fs/promises');
const { prisma } = require('../config');
const { decodeToken } = require('../utils/jwt');
const { deleteTemplate } = require('../services/certificate-service');
const PinataStorageClient = require('../config/storage');

const create = async (req, res) => {
  // HTML template sertifikat dengan styling menggunakan CSS inline
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
        <h1>Sertifikat Kelulusan</h1>
        <p>Dengan ini menyatakan bahwa</p>
        <p class="name">Udin</p>
        <p>Telah berhasil menyelesaikan program pendidikan dan memperoleh kelulusan pada tanggal:</p>
        <p class="date">Dadang</p>
        <a href="#" class="verify-btn">Verifikasi Sertifikat</a>
      </div>
    </body>
    </html>
  `;

  try {

    const browser = await puppeteer.launch({
      headless: 'new', // Mode headless Puppeteer terbaru
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();


    await page.setContent(certificateHtml, { waitUntil: 'networkidle0' });


    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    const pdfPath = './certificate.pdf';
    fs.writeFileSync(pdfPath, pdfBuffer);

    await browser.close();

    res.status(StatusCodes.OK).send("Sertifikat berhasil dibuat");

  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error generating certificate',
      error: err.message,
      data: {},
    });
  }
};

const issueCertificate = async (req, res) => {
  const {
    templateId,
    recipientName,
    issueDate,
    expiryDate,
    targetAddress
  } = req.body;

  try {
    // Get template data
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        user: true // Include user data to get issuer name
      }
    });

    if (!template) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Template tidak ditemukan',
        error: 'Template not found',
        data: {},
      });
    }

    // Check if recipient exists, if not create new user
    const recipient = await prisma.user.upsert({
      where: {
        walletAddress: targetAddress
      },
      update: {}, // Tidak update apa-apa jika user sudah ada
      create: {
        walletAddress: targetAddress,
        name: recipientName, // Gunakan recipientName sebagai nama awal
        createdAt: new Date()
      }
    });

    const result = await generateCertificateFromTemplate({
      template,
      recipientName,
      issueDate,
      expiryDate,
      targetAddress
    });

    const filePath = path.join(__dirname, '..', 'certificates', result.filePath);

    if (!fsSync.existsSync(filePath)) {
      throw new Error(`File tidak ditemukan: ${filePath}`);
    }

    await fs.access(filePath, fs.constants.R_OK);

    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    // Use uploadLargeFile for better performance with large files
    const storageClient = PinataStorageClient.getInstance();
    await storageClient.initialize();
    const cid = await storageClient.uploadLargeFile(fileContent, fileName, 'application/pdf');
    console.log('📤 File uploaded to IPFS with CID:', cid);

    // Get user data from token
    const userData = decodeToken(req.headers.authorization);

    // Generate hash for certificate ID
    const certificateId = keccak256(fileContent);

    // Save certificate data to database
    const certificate = await prisma.certificate.create({
      data: {
        id: certificateId,
        templateId: templateId,
        recipientName,
        certificateTitle: template.name,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        issuerName: userData.name || userData.walletAddress,
        targetAddress,
        issuerAddress: userData.walletAddress,
        filePath: `https://gateway.pinata.cloud/ipfs/${cid}`,
        ipfsCid: cid,
        status: 'ACTIVE'
      }
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Sertifikat berhasil diterbitkan',
      error: {},
      data: {
        ...certificate,
        fileCid: `https://gateway.pinata.cloud/ipfs/${cid}`,
      },
    });

  } catch (err) {
    console.error('🔥 Error issuing certificate:', err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Gagal menerbitkan sertifikat',
      error: err.message,
      data: {},
    });
  }
};

async function verifyCertificate(req, res) {
  const { url } = req.body;

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    const outputDir = "/home/aguhh/Documents/Skripsweet/BE skripsi/src/certificates/downloads";
    const fileName = `certificate_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(filePath, Buffer.from(response.data));

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'File downloaded successfully',
      keccak256: keccak256(response.data),
    });
  } catch (error) {
    console.error('Error downloading file:', error.message);
    throw error;
  }
}

const storageClient = PinataStorageClient.getInstance();

// Update the uploadFile function to use Pinata
const uploadFile = async (fileBuffer, fileName, mimeType) => {
  try {
    await storageClient.initialize();
    const cid = await storageClient.uploadFile(fileBuffer, fileName, mimeType);
    return storageClient.getFileUrl(cid);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

async function uploadTemplateHandler(req, res) {
  try {
    const userData = decodeToken(req.headers.authorization);

    if (!userData?.walletAddress) {
      throw new Error('Invalid token: walletAddress is missing');
    }

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const storageClient = PinataStorageClient.getInstance();
    await storageClient.initialize();

    const uploadDir = path.join(__dirname, '..', 'certificates', 'templates');
    await fss.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    await fss.writeFile(filePath, req.file.buffer);
    console.log('File saved to:', filePath);

    const fileContent = await fss.readFile(filePath);

    // Use uploadLargeFile for better performance with large files
    const cid = await storageClient.uploadLargeFile(fileContent, fileName, req.file.mimetype);
    console.log('📤 Template uploaded to IPFS with CID:', cid);

    await fss.unlink(filePath);

    await prisma.$transaction(async (tx) => {
      await tx.template.create({
        data: {
          user: {
            connect: { walletAddress: userData.walletAddress },
          },
          name: req.body.templateName,
          filePath: `https://gateway.pinata.cloud/ipfs/${cid}`,
          nameX: parseFloat(req.body.positionX),
          nameY: parseFloat(req.body.positionY),
        },
      });
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Template uploaded successfully',
      error: {},
      data: {
        cid: `https://gateway.pinata.cloud/ipfs/${cid}`,
      },
    });
  } catch (err) {
    console.error('🔥 Error uploading template:', err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error uploading template',
      error: err.message,
      data: {},
    });
  }
}

async function getTemplateHandler(req, res) {
  try {
    const userData = decodeToken(req.headers.authorization);

    if (!userData?.walletAddress) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token tidak valid atau kadaluarsa',
        error: 'Invalid or expired token',
        data: {},
      });
    }

    const templates = await prisma.template.findMany({
      where: {
        userId: userData.walletAddress,
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        filePath: true,
        nameX: true,
        nameY: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Templates retrieved successfully',
      error: {},
      data: {
        templates,
      },
    });
  } catch (err) {
    console.error('🔥 Error getting templates:', err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting templates',
      error: err.message,
      data: {},
    });
  }
}

const getCertificatesByTargetAddress = async (req, res) => {
  try {
    const { walletAddress } = req.user;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address tidak ditemukan" });
    }
    const certificates = await prisma.certificate.findMany({
      where: {
        targetAddress: {
          equals: walletAddress,
          mode: 'insensitive'
        }
      },
      include: {
        template: true,
        issuer: {
          select: {
            name: true,
            walletAddress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ success: true, data: certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal mengambil data sertifikat", error: err.message });
  }
};

const getCertificatesByIssuerAddress = async (req, res) => {
  try {
    const { walletAddress } = req.user;
    if (!walletAddress) {
      return res.status(400).json({ success: false, message: "Wallet address tidak ditemukan" });
    }
    const certificates = await prisma.certificate.findMany({
      where: {
        issuerAddress: {
          equals: walletAddress,
          mode: 'insensitive'
        }
      },
      include: {
        template: true,
        recipient: {
          select: {
            name: true,
            walletAddress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ success: true, data: certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal mengambil data sertifikat", error: err.message });
  }
};

const deleteTemplateHandler = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userData = decodeToken(req.headers.authorization);

    if (!userData?.walletAddress) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token tidak valid atau kadaluarsa',
        error: 'Invalid or expired token',
        data: {},
      });
    }

    // Check if template exists and belongs to the user
    const template = await prisma.template.findFirst({
      where: {
        id: parseInt(templateId),
        userId: userData.walletAddress,
        isDeleted: false
      }
    });

    if (!template) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Template tidak ditemukan atau anda tidak memiliki akses',
        error: 'Template not found or unauthorized',
        data: {},
      });
    }

    // Perform soft delete
    await prisma.template.update({
      where: {
        id: parseInt(templateId)
      },
      data: {
        isDeleted: true
      }
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Template berhasil dihapus',
      error: {},
      data: {},
    });
  } catch (error) {
    console.error('Error in deleteTemplateHandler:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Gagal menghapus template',
      error: error.message,
      data: {},
    });
  }
};

module.exports = { create, issueCertificate, verifyCertificate, uploadTemplateHandler, getTemplateHandler, getCertificatesByTargetAddress, getCertificatesByIssuerAddress, deleteTemplateHandler };