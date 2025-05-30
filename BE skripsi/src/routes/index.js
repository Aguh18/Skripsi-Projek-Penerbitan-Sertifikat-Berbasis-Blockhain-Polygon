const express = require("express");

const accountRoutes = require("./account");
const certificateRoutes = require("./certificate");

const router = express.Router();

router.use("/account", accountRoutes);
router.use("/certificate", certificateRoutes);

module.exports = router;
