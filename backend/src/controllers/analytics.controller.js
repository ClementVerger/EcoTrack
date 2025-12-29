// src/controllers/analytics.controller.js
const analyticsService = require("../services/analytics.service");
const { BadRequestError } = require("../utils/errors");

/**
 * GET /analytics/stats
 * Récupérer les statistiques globales de gamification (Admin)
 */
exports.getGlobalStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await analyticsService.getGlobalStats(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /analytics/users/:userId
 * Récupérer les statistiques d'un utilisateur (Admin)
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const stats = await analyticsService.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /analytics/me
 * Récupérer ses propres statistiques (Utilisateur connecté)
 */
exports.getMyStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stats = await analyticsService.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /analytics/trends
 * Récupérer les tendances par période (Admin)
 */
exports.getTrends = async (req, res, next) => {
  try {
    const { period = "day", days = 30 } = req.query;

    if (!["hour", "day", "week", "month"].includes(period)) {
      throw new BadRequestError("Période invalide. Valeurs acceptées: hour, day, week, month");
    }

    const trends = await analyticsService.getTrends(period, parseInt(days));

    return res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /analytics/badges/popular
 * Récupérer les badges les plus populaires (Admin)
 */
exports.getPopularBadges = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const badges = await analyticsService.getPopularBadges(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: { badges },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /analytics/notifications/engagement
 * Récupérer les métriques d'engagement des notifications (Admin)
 */
exports.getNotificationEngagement = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const engagement = await analyticsService.getNotificationEngagement(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    return res.status(200).json({
      success: true,
      data: engagement,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /analytics/track
 * Tracker un événement frontend
 */
exports.trackFrontendEvent = async (req, res, next) => {
  try {
    const { eventType, eventData, sessionId } = req.body;

    if (!eventType) {
      throw new BadRequestError("eventType est requis");
    }

    const allowedEvents = [
      "notification_displayed",
      "notification_clicked",
      "notification_dismissed",
      "rewards_page_viewed",
      "badge_details_viewed",
      "leaderboard_viewed",
    ];

    if (!allowedEvents.includes(eventType)) {
      throw new BadRequestError(`eventType invalide. Valeurs acceptées: ${allowedEvents.join(", ")}`);
    }

    await analyticsService.trackFrontendEvent(eventType, {
      userId: req.user?.id || null,
      eventData,
      sessionId,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Événement enregistré",
    });
  } catch (err) {
    return next(err);
  }
};
