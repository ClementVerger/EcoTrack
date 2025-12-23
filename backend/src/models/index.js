const db = require("../config/database");

module.exports = {
  User: db.User,
  Container: db.Container,
  Report: db.Report,
  PointHistory: db.PointHistory,
  db,
};
