// src/services/analytics.service.js
const { GamificationAnalytics } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

// Constantes fallback si le modèle n'est pas chargé (tests)
const EVENT_TYPES = GamificationAnalytics?.EVENT_TYPES || {
  POINTS_EARNED: "points_earned",
  BADGE_EARNED: "badge_earned",
  LEVEL_UP: "level_up",
  NOTIFICATION_DISPLAYED: "notification_displayed",
  NOTIFICATION_CLICKED: "notification_clicked",
  NOTIFICATION_DISMISSED: "notification_dismissed",
  REWARDS_PAGE_VIEWED: "rewards_page_viewed",
  BADGE_DETAILS_VIEWED: "badge_details_viewed",
  LEADERBOARD_VIEWED: "leaderboard_viewed",
  REPORT_SUBMITTED: "report_submitted",
  REPORT_VALIDATED: "report_validated",
};

const EVENT_CATEGORIES = GamificationAnalytics?.EVENT_CATEGORIES || {
  GAMIFICATION: "gamification",
  NOTIFICATION: "notification",
  ENGAGEMENT: "engagement",
  USER_ACTION: "user_action",
};

const SOURCES = GamificationAnalytics?.SOURCES || {
  BACKEND: "backend",
  FRONTEND: "frontend",
  API: "api",
};

/**
 * Enregistre un événement analytics
 */
const trackEvent = async (eventType, data = {}) => {
  // Skip si le modèle n'est pas disponible (tests)
  if (!GamificationAnalytics) {
    return null;
  }

  const {
    userId = null,
    eventCategory = EVENT_CATEGORIES.GAMIFICATION,
    eventData = null,
    pointsValue = null,
    badgeCode = null,
    levelReached = null,
    source = SOURCES.BACKEND,
    sessionId = null,
    userAgent = null,
    ipAddress = null,
  } = data;

  return GamificationAnalytics.create({
    userId,
    eventType,
    eventCategory,
    eventData,
    pointsValue,
    badgeCode,
    levelReached,
    source,
    sessionId,
    userAgent,
    ipAddress,
  });
};

/**
 * Track points gagnés
 */
const trackPointsEarned = async (userId, points, reason, metadata = {}) => {
  return trackEvent(EVENT_TYPES.POINTS_EARNED, {
    userId,
    pointsValue: points,
    eventData: { reason, ...metadata },
  });
};

/**
 * Track badge obtenu
 */
const trackBadgeEarned = async (userId, badgeCode, badgeName, pointsReward = 0) => {
  return trackEvent(EVENT_TYPES.BADGE_EARNED, {
    userId,
    badgeCode,
    pointsValue: pointsReward,
    eventData: { badgeName },
  });
};

/**
 * Track passage de niveau
 */
const trackLevelUp = async (userId, newLevel, levelName, previousLevel) => {
  return trackEvent(EVENT_TYPES.LEVEL_UP, {
    userId,
    levelReached: newLevel,
    eventData: { levelName, previousLevel },
  });
};

/**
 * Track événement frontend (notification affichée, cliquée, fermée)
 */
const trackFrontendEvent = async (eventType, data = {}) => {
  return trackEvent(eventType, {
    ...data,
    source: SOURCES.FRONTEND,
    eventCategory: EVENT_CATEGORIES.NOTIFICATION,
  });
};

/**
 * Track soumission de signalement
 */
const trackReportSubmitted = async (userId, reportId) => {
  return trackEvent(EVENT_TYPES.REPORT_SUBMITTED, {
    userId,
    eventCategory: EVENT_CATEGORIES.USER_ACTION,
    eventData: { reportId },
  });
};

/**
 * Track validation de signalement
 */
const trackReportValidated = async (userId, reportId, adminId) => {
  return trackEvent(EVENT_TYPES.REPORT_VALIDATED, {
    userId,
    eventCategory: EVENT_CATEGORIES.USER_ACTION,
    eventData: { reportId, validatedBy: adminId },
  });
};

// ============================================
// STATISTIQUES ET RAPPORTS
// ============================================

/**
 * Obtenir les statistiques globales de gamification
 */
const getGlobalStats = async (startDate = null, endDate = null) => {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (endDate) where.createdAt[Op.lte] = endDate;
  }

  const [
    totalPointsEarned,
    totalBadgesEarned,
    totalLevelUps,
    uniqueActiveUsers,
    eventsByType,
  ] = await Promise.all([
    // Total des points distribués
    GamificationAnalytics.sum("pointsValue", {
      where: { ...where, eventType: EVENT_TYPES.POINTS_EARNED },
    }),

    // Total des badges attribués
    GamificationAnalytics.count({
      where: { ...where, eventType: EVENT_TYPES.BADGE_EARNED },
    }),

    // Total des level ups
    GamificationAnalytics.count({
      where: { ...where, eventType: EVENT_TYPES.LEVEL_UP },
    }),

    // Utilisateurs actifs uniques
    GamificationAnalytics.count({
      where,
      distinct: true,
      col: "userId",
    }),

    // Répartition par type d'événement
    GamificationAnalytics.findAll({
      where,
      attributes: [
        "eventType",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["eventType"],
      raw: true,
    }),
  ]);

  return {
    totalPointsEarned: totalPointsEarned || 0,
    totalBadgesEarned,
    totalLevelUps,
    uniqueActiveUsers,
    eventsByType: eventsByType.reduce((acc, e) => {
      acc[e.eventType] = parseInt(e.count);
      return acc;
    }, {}),
  };
};

/**
 * Obtenir les statistiques d'un utilisateur
 */
const getUserStats = async (userId) => {
  const [
    pointsEvents,
    badgesEarned,
    levelUps,
    notificationInteractions,
  ] = await Promise.all([
    // Événements de points
    GamificationAnalytics.findAll({
      where: { userId, eventType: EVENT_TYPES.POINTS_EARNED },
      order: [["createdAt", "DESC"]],
      limit: 20,
      raw: true,
    }),

    // Badges obtenus
    GamificationAnalytics.findAll({
      where: { userId, eventType: EVENT_TYPES.BADGE_EARNED },
      order: [["createdAt", "DESC"]],
      raw: true,
    }),

    // Level ups
    GamificationAnalytics.findAll({
      where: { userId, eventType: EVENT_TYPES.LEVEL_UP },
      order: [["createdAt", "DESC"]],
      raw: true,
    }),

    // Interactions notifications
    GamificationAnalytics.findAll({
      where: {
        userId,
        eventType: {
          [Op.in]: [
            EVENT_TYPES.NOTIFICATION_DISPLAYED,
            EVENT_TYPES.NOTIFICATION_CLICKED,
            EVENT_TYPES.NOTIFICATION_DISMISSED,
          ],
        },
      },
      attributes: [
        "eventType",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["eventType"],
      raw: true,
    }),
  ]);

  const totalPointsEarned = pointsEvents.reduce((sum, e) => sum + (e.points_value || 0), 0);

  return {
    totalPointsEarned,
    pointsEventsCount: pointsEvents.length,
    recentPointsEvents: pointsEvents.slice(0, 10),
    badgesCount: badgesEarned.length,
    badges: badgesEarned,
    levelUpsCount: levelUps.length,
    levelUps,
    notificationInteractions: notificationInteractions.reduce((acc, e) => {
      acc[e.eventType] = parseInt(e.count);
      return acc;
    }, {}),
  };
};

/**
 * Obtenir les tendances par période
 */
const getTrends = async (period = "day", days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let dateFormat;
  switch (period) {
    case "hour":
      dateFormat = "YYYY-MM-DD HH24:00";
      break;
    case "day":
      dateFormat = "YYYY-MM-DD";
      break;
    case "week":
      dateFormat = "IYYY-IW"; // ISO week
      break;
    case "month":
      dateFormat = "YYYY-MM";
      break;
    default:
      dateFormat = "YYYY-MM-DD";
  }

  const trends = await GamificationAnalytics.findAll({
    where: {
      createdAt: { [Op.gte]: startDate },
      eventType: {
        [Op.in]: [
          EVENT_TYPES.POINTS_EARNED,
          EVENT_TYPES.BADGE_EARNED,
          EVENT_TYPES.LEVEL_UP,
        ],
      },
    },
    attributes: [
      [fn("TO_CHAR", col("created_at"), dateFormat), "period"],
      "eventType",
      [fn("COUNT", col("id")), "count"],
      [fn("SUM", col("points_value")), "totalPoints"],
    ],
    group: [literal(`TO_CHAR(created_at, '${dateFormat}')`), "eventType"],
    order: [[literal(`TO_CHAR(created_at, '${dateFormat}')`), "ASC"]],
    raw: true,
  });

  return trends;
};

/**
 * Obtenir les badges les plus populaires
 */
const getPopularBadges = async (limit = 10) => {
  const badges = await GamificationAnalytics.findAll({
    where: { eventType: EVENT_TYPES.BADGE_EARNED },
    attributes: [
      "badgeCode",
      [fn("COUNT", col("id")), "earnedCount"],
      [fn("MIN", col("created_at")), "firstEarned"],
      [fn("MAX", col("created_at")), "lastEarned"],
    ],
    group: ["badgeCode"],
    order: [[literal("COUNT(id)"), "DESC"]],
    limit,
    raw: true,
  });

  return badges;
};

/**
 * Calculer le taux d'engagement notifications
 */
const getNotificationEngagement = async (startDate = null, endDate = null) => {
  const where = {
    eventType: {
      [Op.in]: [
        EVENT_TYPES.NOTIFICATION_DISPLAYED,
        EVENT_TYPES.NOTIFICATION_CLICKED,
        EVENT_TYPES.NOTIFICATION_DISMISSED,
      ],
    },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (endDate) where.createdAt[Op.lte] = endDate;
  }

  const stats = await GamificationAnalytics.findAll({
    where,
    attributes: [
      "eventType",
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["eventType"],
    raw: true,
  });

  const counts = stats.reduce((acc, s) => {
    acc[s.eventType] = parseInt(s.count);
    return acc;
  }, {});

  const displayed = counts[EVENT_TYPES.NOTIFICATION_DISPLAYED] || 0;
  const clicked = counts[EVENT_TYPES.NOTIFICATION_CLICKED] || 0;
  const dismissed = counts[EVENT_TYPES.NOTIFICATION_DISMISSED] || 0;

  return {
    displayed,
    clicked,
    dismissed,
    clickRate: displayed > 0 ? ((clicked / displayed) * 100).toFixed(2) : 0,
    dismissRate: displayed > 0 ? ((dismissed / displayed) * 100).toFixed(2) : 0,
  };
};

module.exports = {
  EVENT_TYPES,
  EVENT_CATEGORIES,
  SOURCES,
  trackEvent,
  trackPointsEarned,
  trackBadgeEarned,
  trackLevelUp,
  trackFrontendEvent,
  trackReportSubmitted,
  trackReportValidated,
  getGlobalStats,
  getUserStats,
  getTrends,
  getPopularBadges,
  getNotificationEngagement,
};
