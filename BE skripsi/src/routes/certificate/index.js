const express = require("express");
const multer = require('multer');

const { InfoController, CertificateController } = require("../../controllers");
const { authMiddleware } = require("../../middlewares");
const { requireIssuer } = require("../../middleware/auth");
const router = express.Router();

const upload = multer();

// Routes that require issuer role
router.post("/generate-from-template", upload.none(), authMiddleware, requireIssuer, CertificateController.issueCertificate);
router.post("/upload-template", upload.single('template'), authMiddleware, requireIssuer, CertificateController.uploadTemplateHandler);
router.delete("/template/:templateId", authMiddleware, requireIssuer, CertificateController.deleteTemplateHandler);

// Routes accessible by all authenticated users
router.post("/verify", authMiddleware, CertificateController.verifyCertificate);
router.get("/template", authMiddleware, CertificateController.getTemplateHandler);
router.get("/by-target", authMiddleware, CertificateController.getCertificatesByTargetAddress);
router.get("/by-issuer", authMiddleware, CertificateController.getCertificatesByIssuerAddress);

// Route untuk mendapatkan sertifikat DRAFT yang dikelompokkan berdasarkan template
router.get("/drafts", authMiddleware, requireIssuer, CertificateController.getDraftCertificatesByTemplate);

// Route untuk mendapatkan detail sertifikat berdasarkan ID
router.get("/:id", authMiddleware, CertificateController.getCertificateById);

module.exports = router;
