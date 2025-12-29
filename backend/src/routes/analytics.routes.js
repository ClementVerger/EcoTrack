// src/routes/analytics.routes.js
const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

const router = express.Router();

// Route publique pour tracker les événements frontend (authentification optionnelle)
router.post("/track", (req, res, next) => {
  // Tenter d'authentifier mais ne pas bloquer si pas de token
  const authHeader = req.get("authorization");
  if (authHeader) {
    return authMiddleware(req, res, () => {
      analyticsController.trackFrontendEvent(req, res, next);
    });
  }
  return analyticsController.trackFrontendEvent(req, res, next);
});

// Routes authentifiées utilisateur
router.use(authMiddleware);

// Mes statistiques personnelles
router.get("/me", analyticsController.getMyStats);

// Routes admin uniquement
router.use(adminMiddleware);

// Statistiques globales
router.get("/stats", analyticsController.getGlobalStats);

// Tendances
router.get("/trends", analyticsController.getTrends);

// Badges populaires
router.get("/badges/popular", analyticsController.getPopularBadges);

// Engagement notifications
router.get("/notifications/engagement", analyticsController.getNotificationEngagement);

// Statistiques d'un utilisateur spécifique
router.get("/users/:userId", analyticsController.getUserStats);

module.exports = router;
