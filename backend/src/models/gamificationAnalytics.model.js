// src/models/gamificationAnalytics.model.js
const { DataTypes } = require("sequelize");

/**
 * Types d'événements analytics gamification
 */
const EVENT_TYPES = {
  // Récompenses
  POINTS_EARNED: "points_earned",
  BADGE_EARNED: "badge_earned",
  LEVEL_UP: "level_up",
  
  // Notifications
  NOTIFICATION_DISPLAYED: "notification_displayed",
  NOTIFICATION_CLICKED: "notification_clicked",
  NOTIFICATION_DISMISSED: "notification_dismissed",
  
  // Engagement
  REWARDS_PAGE_VIEWED: "rewards_page_viewed",
  BADGE_DETAILS_VIEWED: "badge_details_viewed",
  LEADERBOARD_VIEWED: "leaderboard_viewed",
  
  // Actions utilisateur
  REPORT_SUBMITTED: "report_submitted",
  REPORT_VALIDATED: "report_validated",
};

const EVENT_CATEGORIES = {
  GAMIFICATION: "gamification",
  NOTIFICATION: "notification",
  ENGAGEMENT: "engagement",
  USER_ACTION: "user_action",
};

const SOURCES = {
  BACKEND: "backend",
  FRONTEND: "frontend",
  API: "api",
};

module.exports = (sequelize) => {
  const GamificationAnalytics = sequelize.define(
    "GamificationAnalytics",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "user_id",
      },
      eventType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "event_type",
      },
      eventCategory: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: EVENT_CATEGORIES.GAMIFICATION,
        field: "event_category",
      },
      eventData: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: "event_data",
      },
      pointsValue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "points_value",
      },
      badgeCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "badge_code",
      },
      levelReached: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "level_reached",
      },
      source: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: SOURCES.BACKEND,
      },
      sessionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "session_id",
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "user_agent",
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: "ip_address",
      },
    },
    {
      tableName: "gamification_analytics",
      timestamps: true,
      underscored: true,
      updatedAt: false, // Événements immuables
    }
  );

  // Exposer les constantes
  GamificationAnalytics.EVENT_TYPES = EVENT_TYPES;
  GamificationAnalytics.EVENT_CATEGORIES = EVENT_CATEGORIES;
  GamificationAnalytics.SOURCES = SOURCES;

  return GamificationAnalytics;
};
