const express = require("express");
const cors = require("cors");
const db = require("./config/database");

const routes = require("./routes");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

// Synchroniser la base de données
db.sequelize
  .sync({ alter: process.env.NODE_ENV === "development" })
  .catch((err) => {
    console.error("Erreur de synchronisation DB:", err);
  });

module.exports = app;
