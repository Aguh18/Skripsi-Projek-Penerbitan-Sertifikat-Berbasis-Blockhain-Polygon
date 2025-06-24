const express = require("express");

const { accountController } = require("../../controllers");
const { authMiddleware } = require("../../middlewares");

const router = express.Router();

router.post("/login", accountController.login);
router.put("/profile", authMiddleware, accountController.updateProfile);
router.get("/me", authMiddleware, accountController.me);
router.post("/issuer-application", authMiddleware, accountController.createIssuerApplication);
router.get("/issuer-application", authMiddleware, accountController.getIssuerApplications);
router.post("/issuer-application/approve", authMiddleware, accountController.approveIssuerApplication);
router.post("/issuer-application/reject", authMiddleware, accountController.rejectIssuerApplication);
router.get("/issuer-application/status", authMiddleware, accountController.getMyIssuerApplicationStatus);
router.get("/users", authMiddleware, accountController.getAllUsers);

module.exports = router;
