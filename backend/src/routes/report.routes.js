// src/routes/report.routes.js
const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");
const { reportValidation } = require("../middlewares/validate.middleware");

const router = express.Router();

// Toutes les routes nécessitent une authentification JWT
router.use(authMiddleware);

// POST /reports - Créer un signalement
router.post("/", reportValidation, reportController.createReport);

// GET /reports - Liste tous les signalements
router.get("/", reportController.getAllReports);

// GET /reports/me - Signalements de l'utilisateur connecté
router.get("/me", reportController.getMyReports);

// PUT /reports/:id/validate - Valider un signalement (Admin uniquement)
router.put("/:id/validate", adminMiddleware, reportController.validateReport);

// PUT /reports/:id/reject - Rejeter un signalement (Admin uniquement)
router.put("/:id/reject", adminMiddleware, reportController.rejectReport);

module.exports = router;