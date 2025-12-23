// src/services/report.service.js
const { Op } = require("sequelize");
const db = require("../config/database");
const { NotFoundError, TooManyRequestsError, BadRequestError, ErrorCodes } = require("../utils/errors");
const pointService = require("./point.service");

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
        [Op.gte]: oneHourAgo,
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
 * @throws {NotFoundError} Si conteneur non trouvé
 * @throws {TooManyRequestsError} Si doublon détecté
 */
exports.createReport = async ({ userId, containerId, latitude, longitude }) => {
  // Vérifier que le conteneur existe
  const container = await db.Container.findByPk(containerId);
  if (!container) {
    throw new NotFoundError(
      "Conteneur non trouvé",
      ErrorCodes.CONTAINER_NOT_FOUND
    );
  }

  // Vérifier les doublons (même user, même container, < 1h)
  const existingReport = await findRecentDuplicate(userId, containerId);
  if (existingReport) {
    const minutesAgo = Math.round(
      (Date.now() - existingReport.createdAt.getTime()) / 60000
    );
    const minutesRemaining = Math.max(1, 60 - minutesAgo);
    const secondsRemaining = minutesRemaining * 60;

    throw new TooManyRequestsError(
      `Vous avez déjà signalé ce conteneur il y a ${minutesAgo} minute(s). ` +
        `Veuillez attendre ${minutesRemaining} minute(s) avant de signaler à nouveau.`,
      ErrorCodes.REPORT_DUPLICATE,
      secondsRemaining
    );
  }

  // Créer le signalement
  const report = await db.Report.create({
    userId,
    containerId,
    type: "CONTENEUR_PLEIN",
    status: "pending",
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
 * Valider un signalement et attribuer les points à l'utilisateur
 * @param {string} reportId - ID du signalement
 * @param {string} adminId - ID de l'admin qui valide
 * @returns {Promise<Object>} Le signalement mis à jour
 * @throws {NotFoundError} Si signalement non trouvé
 * @throws {BadRequestError} Si signalement déjà traité
 */
exports.validateReport = async (reportId, adminId) => {
  const report = await db.Report.findByPk(reportId);
  
  if (!report) {
    throw new NotFoundError("Signalement non trouvé", ErrorCodes.REPORT_NOT_FOUND);
  }

  if (report.status !== "pending") {
    throw new BadRequestError(
      `Ce signalement a déjà été traité (status: ${report.status})`,
      ErrorCodes.REPORT_ALREADY_PROCESSED
    );
  }

  // Utiliser une transaction pour garantir la cohérence
  const transaction = await db.sequelize.transaction();

  try {
    // Mettre à jour le signalement
    await report.update(
      {
        status: "validated",
        validatedAt: new Date(),
        validatedBy: adminId,
      },
      { transaction }
    );

    // Créditer les points à l'utilisateur
    await pointService.creditReportPoints(report.userId, reportId, transaction);

    await transaction.commit();

    // Retourner le signalement avec les relations
    return db.Report.findByPk(reportId, {
      include: [
        {
          association: "user",
          attributes: ["id", "firstname", "lastname", "email", "points"],
        },
        {
          association: "container",
          attributes: ["id", "type", "status"],
        },
      ],
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Rejeter un signalement
 * @param {string} reportId - ID du signalement
 * @param {string} adminId - ID de l'admin qui rejette
 * @returns {Promise<Object>} Le signalement mis à jour
 */
exports.rejectReport = async (reportId, adminId) => {
  const report = await db.Report.findByPk(reportId);
  
  if (!report) {
    throw new NotFoundError("Signalement non trouvé", ErrorCodes.REPORT_NOT_FOUND);
  }

  if (report.status !== "pending") {
    throw new BadRequestError(
      `Ce signalement a déjà été traité (status: ${report.status})`,
      ErrorCodes.REPORT_ALREADY_PROCESSED
    );
  }

  await report.update({
    status: "rejected",
    validatedAt: new Date(),
    validatedBy: adminId,
  });

  return db.Report.findByPk(reportId, {
    include: [
      {
        association: "user",
        attributes: ["id", "firstname", "lastname", "email"],
      },
      {
        association: "container",
        attributes: ["id", "type", "status"],
      },
    ],
  });
};

/**
 * Récupérer tous les signalements
 * @param {Object} [filters] - Filtres optionnels
 * @param {string} [filters.status] - Filtrer par status
 * @returns {Promise<Array>} Liste des signalements
 */
exports.getAllReports = async (filters = {}) => {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }

  return db.Report.findAll({
    where,
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