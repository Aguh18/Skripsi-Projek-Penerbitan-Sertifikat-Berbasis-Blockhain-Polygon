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
const { parseDate, isValidExpiryDate, isExpired } = require('../utils/dateUtils');

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
    // Validasi format tanggal
    if (!parseDate(issueDate)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Format tanggal penerbitan tidak valid. Gunakan format YYYY-MM-DD',
        error: 'Invalid issue date format',
        data: {},
      });
    }

    if (expiryDate && !parseDate(expiryDate)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Format tanggal kadaluarsa tidak valid. Gunakan format YYYY-MM-DD',
        error: 'Invalid expiry date format',
        data: {},
      });
    }

    // Validasi expiry date harus lebih baru dari issue date
    if (expiryDate && !isValidExpiryDate(expiryDate, issueDate)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Tanggal kadaluarsa harus lebih baru dari tanggal penerbitan',
        error: 'Invalid expiry date',
        data: {},
      });
    }

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

    // Parse dates dengan utility function
    const parsedIssueDate = parseDate(issueDate);
    const parsedExpiryDate = expiryDate ? parseDate(expiryDate) : null;

    // Save certificate data to database
    const certificate = await prisma.certificate.create({
      data: {
        id: certificateId,
        templateId: templateId,
        recipientName,
        certificateTitle: template.name,
        issueDate: parsedIssueDate,
        expiryDate: parsedExpiryDate,
        issuerName: userData.name || userData.walletAddress,
        targetAddress,
        issuerAddress: userData.walletAddress,
        filePath: `https://gateway.pinata.cloud/ipfs/${cid}`,
        ipfsCid: cid,
        status: 'DRAFT'
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

// Helper untuk update status sertifikat
const setCertificateStatus = async (certificateId, status) => {
  await prisma.certificate.update({
    where: { id: certificateId },
    data: { status }
  });
};

// Contoh penggunaan setelah publish ke blockchain:
// await setCertificateStatus(certificateId, 'ACTIVE');
// Contoh penggunaan setelah revoke di blockchain:
// await setCertificateStatus(certificateId, 'REVOKED');

const getDraftCertificatesByTemplate = async (req, res) => {
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

    // Get all draft certificates grouped by template
    const draftCertificates = await prisma.certificate.findMany({
      where: {
        issuerAddress: userData.walletAddress,
        status: 'DRAFT'
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            filePath: true
          }
        },
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

    // Group certificates by template
    const groupedCertificates = draftCertificates.reduce((acc, cert) => {
      const templateId = cert.template.id;
      if (!acc[templateId]) {
        acc[templateId] = {
          template: cert.template,
          certificates: []
        };
      }
      acc[templateId].certificates.push(cert);
      return acc;
    }, {});

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Draft certificates retrieved successfully',
      error: {},
      data: Object.values(groupedCertificates)
    });

  } catch (err) {
    console.error('🔥 Error getting draft certificates:', err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting draft certificates',
      error: err.message,
      data: {},
    });
  }
};

const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        template: true,
        recipient: true,
        issuer: true,
      },
    });
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Sertifikat tidak ditemukan",
        data: {},
      });
    }
    return res.status(200).json({
      success: true,
      message: "Sertifikat ditemukan",
      data: certificate,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data sertifikat",
      error: err.message,
      data: {},
    });
  }
};

const bulkGenerateCertificates = async (req, res) => {
  const { certificates } = req.body;
  if (!Array.isArray(certificates) || certificates.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'No certificates provided',
      data: {},
    });
  }
  const userData = decodeToken(req.headers.authorization);
  const results = [];
  for (const cert of certificates) {
    try {
      // You may want to validate cert fields here
      const template = await prisma.template.findUnique({
        where: { id: cert.template },
        include: { user: true }
      });
      if (!template) throw new Error('Template not found');
      const recipient = await prisma.user.upsert({
        where: { walletAddress: cert.targetAddress },
        update: {},
        create: {
          walletAddress: cert.targetAddress,
          name: cert.recipientName,
          createdAt: new Date()
        }
      });
      const result = await generateCertificateFromTemplate({
        template,
        recipientName: cert.recipientName,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        targetAddress: cert.targetAddress
      });
      const filePath = path.join(__dirname, '..', 'certificates', result.filePath);
      if (!fsSync.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
      await fs.access(filePath, fs.constants.R_OK);
      const fileContent = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const storageClient = PinataStorageClient.getInstance();
      await storageClient.initialize();
      const cid = await storageClient.uploadLargeFile(fileContent, fileName, 'application/pdf');
      const certificateId = keccak256(fileContent);
      const certificate = await prisma.certificate.create({
        data: {
          id: certificateId,
          templateId: cert.template,
          recipientName: cert.recipientName,
          certificateTitle: template.name,
          issueDate: new Date(cert.issueDate),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
          issuerName: userData.name || userData.walletAddress,
          targetAddress: cert.targetAddress,
          issuerAddress: userData.walletAddress,
          ipfsCid: cid,
          filePath: `https://gateway.pinata.cloud/ipfs/${cid}`,
          status: 'DRAFT'
        }
      });
      results.push({ success: true, id: certificateId, recipient: cert.recipientName });
    } catch (err) {
      results.push({ success: false, error: err.message, recipient: cert.recipientName });
    }
  }
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Bulk certificate generation completed',
    results
  });
};

const setCertificateStatusBulk = async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !status) {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }
  await prisma.certificate.updateMany({
    where: { id: { in: ids } },
    data: { status }
  });
  res.json({ success: true });
};

module.exports = { create, issueCertificate, verifyCertificate, uploadTemplateHandler, getTemplateHandler, getCertificatesByTargetAddress, getCertificatesByIssuerAddress, deleteTemplateHandler, getDraftCertificatesByTemplate, setCertificateStatus, getCertificateById, bulkGenerateCertificates, setCertificateStatusBulk };