// src/config/database.js
const { Sequelize } = require("sequelize");
const buildUser = require("../models/user.model");
const buildContainer = require("../models/container.model");
const buildReport = require("../models/report.model");

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

// Définir les associations
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

module.exports = db;
