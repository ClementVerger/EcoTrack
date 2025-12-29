const db = require("../config/database");

module.exports = {
  User: db.User,
  Container: db.Container,
  Report: db.Report,
  PointHistory: db.PointHistory,
  Badge: db.Badge,
  UserBadge: db.UserBadge,
  Level: db.Level,
  RewardHistory: db.RewardHistory,
  GamificationAnalytics: db.GamificationAnalytics,
  db,
};
