const express = require("express");
const multer = require('multer');

const { InfoController, CertificateController } = require("../../controllers");
const { authMiddleware } = require("../../middlewares");
const router = express.Router();

const upload = multer();

router.post("/generate-from-template", upload.none(), authMiddleware, CertificateController.issueCertificate);
router.post("/verify", authMiddleware, CertificateController.verifyCertificate);
router.post("/upload-template", upload.single('template'), authMiddleware, CertificateController.uploadTemplateHandler);
router.get("/template", authMiddleware, CertificateController.getTemplateHandler);

module.exports = router;
