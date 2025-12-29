// src/config/database.js
const { Sequelize } = require("sequelize");
const buildUser = require("../models/user.model");
const buildContainer = require("../models/container.model");
const buildReport = require("../models/report.model");
const buildPointHistory = require("../models/pointHistory.model");
const buildBadge = require("../models/badge.model");
const buildUserBadge = require("../models/userBadge.model");
const buildLevel = require("../models/level.model");
const buildRewardHistory = require("../models/rewardHistory.model");
const buildGamificationAnalytics = require("../models/gamificationAnalytics.model");

const sequelize = new Sequelize(
  process.env.DB_NAME || "ecotrack",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Init models
db.User = buildUser(sequelize);
db.Container = buildContainer(sequelize);
db.Report = buildReport(sequelize);
db.PointHistory = buildPointHistory(sequelize);
db.Badge = buildBadge(sequelize);
db.UserBadge = buildUserBadge(sequelize);
db.Level = buildLevel(sequelize);
db.RewardHistory = buildRewardHistory(sequelize);
db.GamificationAnalytics = buildGamificationAnalytics(sequelize);

// ============================================
// Associations
// ============================================

// User -> Reports (1:N)
db.User.hasMany(db.Report, {
  foreignKey: "userId",
  as: "reports",
});
db.Report.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

// Container -> Reports (1:N)
db.Container.hasMany(db.Report, {
  foreignKey: "containerId",
  as: "reports",
});
db.Report.belongsTo(db.Container, {
  foreignKey: "containerId",
  as: "container",
});

// User -> PointHistory (1:N)
db.User.hasMany(db.PointHistory, {
  foreignKey: "userId",
  as: "pointHistory",
});
db.PointHistory.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

// User <-> Badge (N:M via UserBadge)
db.User.belongsToMany(db.Badge, {
  through: db.UserBadge,
  foreignKey: "userId",
  otherKey: "badgeId",
  as: "badges",
});
db.Badge.belongsToMany(db.User, {
  through: db.UserBadge,
  foreignKey: "badgeId",
  otherKey: "userId",
  as: "users",
});

// User -> UserBadge (1:N) - pour accès direct
db.User.hasMany(db.UserBadge, {
  foreignKey: "userId",
  as: "userBadges",
});
db.UserBadge.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

// Badge -> UserBadge (1:N)
db.Badge.hasMany(db.UserBadge, {
  foreignKey: "badgeId",
  as: "userBadges",
});
db.UserBadge.belongsTo(db.Badge, {
  foreignKey: "badgeId",
  as: "badge",
});

// User -> RewardHistory (1:N)
db.User.hasMany(db.RewardHistory, {
  foreignKey: "userId",
  as: "rewardHistory",
});
db.RewardHistory.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

// User -> GamificationAnalytics (1:N)
db.User.hasMany(db.GamificationAnalytics, {
  foreignKey: "userId",
  as: "analyticsEvents",
});
db.GamificationAnalytics.belongsTo(db.User, {
  foreignKey: "userId",
  as: "user",
});

module.exports = db;
