// src/controllers/report.controller.js
const reportService = require("../services/report.service");

/**
 * POST /reports
 * Créer un nouveau signalement (JWT requis)
 */
exports.createReport = async (req, res, next) => {
  try {
    const userId = req.user.id; // Extrait du JWT par auth.middleware
    const { containerId, latitude, longitude } = req.body;

    const report = await reportService.createReport({
      userId,
      containerId,
      latitude,
      longitude,
    });

    return res.status(201).json({
      success: true,
      message: "Signalement créé avec succès",
      data: { report },
    });
  } catch (err) {
    return next(err); // Déléguer au middleware d'erreur centralisé
  }
};

/**
 * GET /reports
 * Récupérer tous les signalements (JWT requis)
 */
exports.getAllReports = async (req, res, next) => {
  try {
    const reports = await reportService.getAllReports();

    return res.status(200).json({
      success: true,
      data: {
        count: reports.length,
        reports,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /reports/me
 * Récupérer les signalements de l'utilisateur connecté (JWT requis)
 */
exports.getMyReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const reports = await reportService.getReportsByUser(userId);

    return res.status(200).json({
      success: true,
      data: {
        count: reports.length,
        reports,
      },
    });
  } catch (err) {
    return next(err);
  }
};