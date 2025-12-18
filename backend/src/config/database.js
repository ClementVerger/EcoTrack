// src/config/database.js
const { Sequelize } = require("sequelize");
const buildUser = require("../models/user.model");

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

// init models
db.User = buildUser(sequelize);

module.exports = db;
