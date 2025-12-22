// src/services/report.service.js
const db = require("../config/database");

/**
 * Créer un nouveau signalement
 * @param {Object} data - Données du signalement
 * @param {string} data.userId - ID de l'utilisateur (depuis JWT)
 * @param {string} data.containerId - ID du conteneur signalé
 * @param {number} data.latitude - Latitude GPS
 * @param {number} data.longitude - Longitude GPS
 * @returns {Promise<Object>} Le signalement créé avec ses relations
 */
exports.createReport = async ({ userId, containerId, latitude, longitude }) => {
  // Vérifier que le conteneur existe
  const container = await db.Container.findByPk(containerId);
  if (!container) {
    const error = new Error("Conteneur non trouvé");
    error.statusCode = 404;
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