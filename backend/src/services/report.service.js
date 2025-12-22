// src/services/report.service.js
const { Op } = require("sequelize");
const db = require("../config/database");

// Délai anti-doublon en millisecondes (1 heure)
const DUPLICATE_DELAY_MS = 60 * 60 * 1000;

/**
 * Vérifie si un signalement similaire existe déjà (anti-doublon)
 * @param {string} userId - ID de l'utilisateur
 * @param {string} containerId - ID du conteneur
 * @returns {Promise<Object|null>} Le signalement existant ou null
 */
const findRecentDuplicate = async (userId, containerId) => {
  const oneHourAgo = new Date(Date.now() - DUPLICATE_DELAY_MS);

  return db.Report.findOne({
    where: {
      userId,
      containerId,
      createdAt: {
        [Op.gte]: oneHourAgo, // createdAt >= (now - 1h)
      },
    },
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Créer un nouveau signalement
 * @param {Object} data - Données du signalement
 * @param {string} data.userId - ID de l'utilisateur (depuis JWT)
 * @param {string} data.containerId - ID du conteneur signalé
 * @param {number} data.latitude - Latitude GPS
 * @param {number} data.longitude - Longitude GPS
 * @returns {Promise<Object>} Le signalement créé avec ses relations
 * @throws {Error} Si doublon détecté ou conteneur non trouvé
 */
exports.createReport = async ({ userId, containerId, latitude, longitude }) => {
  // Vérifier que le conteneur existe
  const container = await db.Container.findByPk(containerId);
  if (!container) {
    const error = new Error("Conteneur non trouvé");
    error.statusCode = 404;
    throw error;
  }

  // Vérifier les doublons (même user, même container, < 1h)
  const existingReport = await findRecentDuplicate(userId, containerId);
  if (existingReport) {
    const minutesAgo = Math.round((Date.now() - existingReport.createdAt.getTime()) / 60000);
    const minutesRemaining = 60 - minutesAgo;
    
    const error = new Error(
      `Vous avez déjà signalé ce conteneur il y a ${minutesAgo} minute(s). ` +
      `Veuillez attendre ${minutesRemaining} minute(s) avant de signaler à nouveau.`
    );
    error.statusCode = 429; // Too Many Requests
    error.existingReportId = existingReport.id;
    throw error;
  }

  // Créer le signalement
  const report = await db.Report.create({
    userId,
    containerId,
    type: "CONTENEUR_PLEIN",
    latitude,
    longitude,
  });

  // Retourner avec les relations
  return db.Report.findByPk(report.id, {
    include: [
      {
        association: "user",
        attributes: ["id", "firstname", "lastname", "email"],
      },
      {
        association: "container",
        attributes: ["id", "type", "status", "latitude", "longitude"],
      },
    ],
  });
};

/**
 * Récupérer tous les signalements
 * @returns {Promise<Array>} Liste des signalements
 */
exports.getAllReports = async () => {
  return db.Report.findAll({
    include: [
      {
        association: "user",
        attributes: ["id", "firstname", "lastname"],
      },
      {
        association: "container",
        attributes: ["id", "type", "status"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Récupérer les signalements d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des signalements de l'utilisateur
 */
exports.getReportsByUser = async (userId) => {
  return db.Report.findAll({
    where: { userId },
    include: [
      {
        association: "container",
        attributes: ["id", "type", "status", "latitude", "longitude"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};