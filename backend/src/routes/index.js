const express = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const reportRoutes = require("./report.routes");
const analyticsRoutes = require("./analytics.routes");
const containerRoutes = require("./container.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/containers", containerRoutes);

module.exports = router;
