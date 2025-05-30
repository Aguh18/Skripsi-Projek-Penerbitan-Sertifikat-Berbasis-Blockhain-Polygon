const express = require("express");

const { accountController } = require("../../controllers");
const { authMiddleware } = require("../../middlewares");

const router = express.Router();

router.post("/login", accountController.login);
router.put("/profile", authMiddleware, accountController.updateProfile);
router.get("/me", authMiddleware, accountController.me);

module.exports = router;
