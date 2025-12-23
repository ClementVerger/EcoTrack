// src/routes/report.routes.js
const express = require("express");
const reportController = require("../controllers/report.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { reportValidation } = require("../middlewares/validate.middleware");
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  ErrorCodes,
} = require("../utils/errors");

const router = express.Router();

// Toutes les routes nécessitent une authentification JWT
router.use(authMiddleware);

// POST /reports - Créer un signalement
router.post("/", reportValidation, reportController.createReport);

// GET /reports - Liste tous les signalements
router.get("/", reportController.getAllReports);

// GET /reports/me - Signalements de l'utilisateur connecté
router.get("/me", reportController.getMyReports);

// Gestion des erreurs
router.use((err, req, res, next) => {
  console.error(err); // Log de l'erreur pour le suivi

  // Erreurs connues (opérationnelles)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
  }

  // Erreurs inconnues
  const unknownError = new Error("Une erreur inattendue est survenue");
  res.status(500).json({
    status: "error",
    code: "INTERNAL_SERVER_ERROR",
    message: unknownError.message,
  });
});

module.exports = router;