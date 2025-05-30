const express = require("express");
const multer = require('multer');

const { InfoController, CertifcateController } = require("../../controllers");
const { authMiddleware } = require("../../middlewares");
const router = express.Router();


const upload = multer();

router.post("/generate", upload.none(), authMiddleware, CertifcateController.issueCertificate);
router.post("/generate-from-template", upload.none(), authMiddleware, CertifcateController.generateFromTemplate);
router.post("/verify", authMiddleware, CertifcateController.verifyCertificate);
router.post("/upload-template", upload.single('template'), authMiddleware, CertifcateController.uploadTemplateHandler);
router.get("/template", authMiddleware, CertifcateController.getTemplateHandler);


module.exports = router;
