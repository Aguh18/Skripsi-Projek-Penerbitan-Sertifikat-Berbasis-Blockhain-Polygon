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
    template,
    recipientName,
    certificateTitle,
    issueDate,
    expiryDate,
    description,
    category,
    targetAddress
  } = req.body;

  try {
    const result = await generateCertificate(req.body);

    const web3Client = Web3StorageClient.getInstance();
    await web3Client.initialize();

    const filePath = path.join(__dirname, '..', 'certificates', result.filePath);

    if (!fsSync.existsSync(filePath)) {
      throw new Error(`File tidak ditemukan: ${filePath}`);
    }

    await fs.access(filePath, fs.constants.R_OK);

    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const file = new File([fileContent], fileName, { type: 'application/pdf' });

    // Use uploadLargeFile for better performance with large files
    const cid = await web3Client.uploadLargeFile(file);
    console.log('📤 File uploaded to IPFS with CID:', cid);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Certificate issued successfully',
      error: {},
      data: {
        ...result,
        fileCid: "https://" + cid + ".ipfs.w3s.link/" + result.filePath,
      },
    });

  } catch (err) {
    console.error('🔥 Error issuing certificate:', err.message);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error issuing certificate',
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

async function uploadTemplateHandler(req, res) {
  try {
    const userData = decodeToken(req.headers.authorization);

    if (!userData?.walletAddress) {
      throw new Error('Invalid token: walletAddress is missing');
    }

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const web3Client = Web3StorageClient.getInstance();
    await web3Client.initialize();

    const uploadDir = path.join(__dirname, '..', 'certificates', 'templates');
    await fss.mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);

    await fss.writeFile(filePath, req.file.buffer);
    console.log('File saved to:', filePath);

    const fileContent = await fss.readFile(filePath);
    const file = new File([fileContent], fileName, { type: req.file.mimetype });

    // Use uploadLargeFile for better performance with large files
    const cid = await web3Client.uploadLargeFile(file);
    console.log('📤 Template uploaded to IPFS with CID:', cid);

    await fss.unlink(filePath);

    await prisma.$transaction(async (tx) => {
      await tx.template.create({
        data: {
          user: {
            connect: { walletAddress: userData.walletAddress },
          },
          name: req.body.templateName,
          filePath: `https://${cid}.ipfs.w3s.link/${fileName}`,
          nameX: parseFloat(req.body.positionX),
          nameY: parseFloat(req.body.positionY),
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Template uploaded successfully',
      data: {
        fileCid: "https://" + cid + ".ipfs.w3s.link/" + fileName,
      },
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading template',
      error: error.message,
    });
  }
}


async function getTemplateHandler(req, res) {
  try {

    data = await getTemplate(req);

    res.status(200).json({
      success: true,
      message: 'Template uploaded successfully',
      data: {
        templates: data,
      },
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading template',
      error: error.message,
    });
  }
}

async function generateFromTemplate(req, res) {
  try {
    console.log('🔍 Debug: Request body:', req.body);

    // Data dummy untuk testing
    const dummyUserData = {
      name: "Test Issuer",
      walletAddress: "0x1234567890abcdef1234567890abcdef12345678"
    };

    const {
      templateId,
      recipientName,
      certificateTitle,
      issueDate,
      expiryDate,
      description,
      category,
      targetAddress
    } = req.body;

    // Validasi input
    if (!templateId || !recipientName || !certificateTitle || !issueDate || !targetAddress) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields'
      });
    }

    // Generate nomor sertifikat
    const certificateNumber = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log('📝 Debug: Generated certificate number:', certificateNumber);

    // Ambil template dari database
    console.log('🔍 Debug: Fetching template with ID:', templateId);
    const template = await prisma.template.findUnique({
      where: { id: parseInt(templateId) }
    });

    if (!template) {
      console.log('❌ Debug: Template not found for ID:', templateId);
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }
    console.log('✅ Debug: Template found:', template);

    // Cek dan buat user dummy untuk penerbit jika belum ada
    console.log('🔍 Debug: Checking dummy issuer user');
    let dummyIssuer = await prisma.user.findUnique({
      where: { walletAddress: dummyUserData.walletAddress }
    });

    if (!dummyIssuer) {
      console.log('🔄 Debug: Creating dummy issuer user');
      dummyIssuer = await prisma.user.create({
        data: {
          name: dummyUserData.name,
          walletAddress: dummyUserData.walletAddress,
          createdAt: new Date()
        }
      });
      console.log('✅ Debug: Dummy issuer user created:', dummyIssuer);
    }

    // Cek dan buat user dummy untuk penerima jika belum ada
    console.log('🔍 Debug: Checking dummy recipient user');
    let dummyRecipient = await prisma.user.findUnique({
      where: { walletAddress: targetAddress }
    });

    if (!dummyRecipient) {
      console.log('🔄 Debug: Creating dummy recipient user');
      dummyRecipient = await prisma.user.create({
        data: {
          name: recipientName,
          walletAddress: targetAddress,
          createdAt: new Date()
        }
      });
      console.log('✅ Debug: Dummy recipient user created:', dummyRecipient);
    }

    // Generate sertifikat menggunakan template dari IPFS
    console.log('🔄 Debug: Starting certificate generation from template');
    const result = await generateCertificateFromTemplate({
      template,
      certificateNumber,
      recipientName,
      certificateTitle,
      issueDate,
      expiryDate,
      description,
      category,
      targetAddress,
      issuerName: dummyIssuer.name,
      issuerAddress: dummyIssuer.walletAddress
    });
    console.log('✅ Debug: Certificate generated successfully:', result);

    // Upload ke IPFS
    console.log('🔄 Debug: Initializing Web3Storage client');
    const web3Client = Web3StorageClient.getInstance();
    await web3Client.initialize();

    const filePath = path.join(__dirname, '..', 'certificates', result.filePath);
    console.log('📁 Debug: Certificate file path:', filePath);

    const fileContent = await fs.readFile(filePath);
    const fileName = path.basename(filePath);
    const file = new File([fileContent], fileName, { type: 'application/pdf' });

    console.log('🔄 Debug: Uploading to IPFS');
    const cid = await web3Client.uploadLargeFile(file);
    console.log('✅ Debug: File uploaded to IPFS with CID:', cid);

    // Simpan ke database
    console.log('🔄 Debug: Saving certificate to database');
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        templateId: parseInt(templateId),
        recipientName,
        certificateTitle,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description,
        issuerName: dummyIssuer.name,
        signaturePath: null,
        category,
        targetAddress,
        issuerAddress: dummyIssuer.walletAddress,
        ipfsCid: cid,
        qrCodeUrl: result.qrCodeUrl,
        filePath: `https://${cid}.ipfs.w3s.link/${fileName}`,
        status: 'active'
      }
    });
    console.log('✅ Debug: Certificate saved to database:', certificate);

    return res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      error: {},
      data: {
        ...result,
        fileCid: `https://${cid}.ipfs.w3s.link/${fileName}`,
        certificate,
      },
    });

  } catch (error) {
    console.error('❌ Debug: Error in generateFromTemplate:', error);
    console.error('❌ Debug: Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
      data: {},
    });
  }
}

module.exports = { create, issueCertificate, verifyCertificate, uploadTemplateHandler, getTemplateHandler, generateFromTemplate };