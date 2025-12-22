const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const reportRoutes = require("./report.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);

module.exports = router;
