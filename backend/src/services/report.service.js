// src/services/report.service.js
const { Op } = require("sequelize");
const db = require("../config/database");
const { NotFoundError, TooManyRequestsError, BadRequestError, ErrorCodes } = require("../utils/errors");
const pointService = require("./point.service");
const rewardService = require("./reward.service");

// Délai anti-doublon en millisecondes (1 heure)
const DUPLICATE_DELAY_MS = 60 * 60 * 1000;

/**
 * Vérifie si un signalement similaire existe déjà (anti-doublon)
 */
const findRecentDuplicate = async (userId, containerId) => {
  const oneHourAgo = new Date(Date.now() - DUPLICATE_DELAY_MS);

  return db.Report.findOne({
    where: {
      userId,
      containerId,
      createdAt: { [Op.gte]: oneHourAgo },
    },
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Créer un nouveau signalement
 */
exports.createReport = async ({ userId, containerId, latitude, longitude }) => {
  const container = await db.Container.findByPk(containerId);
  if (!container) {
    throw new NotFoundError("Conteneur non trouvé", ErrorCodes.CONTAINER_NOT_FOUND);
  }

  const existingReport = await findRecentDuplicate(userId, containerId);
  if (existingReport) {
    const minutesAgo = Math.round((Date.now() - existingReport.createdAt.getTime()) / 60000);
    const minutesRemaining = Math.max(1, 60 - minutesAgo);

    throw new TooManyRequestsError(
      `Vous avez déjà signalé ce conteneur il y a ${minutesAgo} minute(s). Veuillez attendre ${minutesRemaining} minute(s).`,
      ErrorCodes.REPORT_DUPLICATE,
      minutesRemaining * 60
    );
  }

  const report = await db.Report.create({
    userId,
    containerId,
    type: "CONTENEUR_PLEIN",
    status: "pending",
    latitude,
    longitude,
  });

  return db.Report.findByPk(report.id, {
    include: [
      { association: "user", attributes: ["id", "firstname", "lastname", "email"] },
      { association: "container", attributes: ["id", "type", "status", "latitude", "longitude"] },
    ],
  });
};

/**
 * Valider un signalement et attribuer les récompenses
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

    // Créditer les points
    await pointService.creditReportPoints(report.userId, reportId, transaction);

    // Vérifier et attribuer les récompenses (badges, level up)
    const rewards = await rewardService.processRewardsAfterActivity(report.userId, transaction);

    await transaction.commit();

    // Récupérer le signalement avec les relations
    const updatedReport = await db.Report.findByPk(reportId, {
      include: [
        { association: "user", attributes: ["id", "firstname", "lastname", "email", "points", "level"] },
        { association: "container", attributes: ["id", "type", "status"] },
      ],
    });

    return { report: updatedReport, rewards };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Rejeter un signalement
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
      { association: "user", attributes: ["id", "firstname", "lastname", "email"] },
      { association: "container", attributes: ["id", "type", "status"] },
    ],
  });
};

/**
 * Récupérer tous les signalements
 */
exports.getAllReports = async (filters = {}) => {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }

  return db.Report.findAll({
    where,
    include: [
      { association: "user", attributes: ["id", "firstname", "lastname"] },
      { association: "container", attributes: ["id", "type", "status"] },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Récupérer les signalements d'un utilisateur
 */
exports.getReportsByUser = async (userId) => {
  return db.Report.findAll({
    where: { userId },
    include: [
      { association: "container", attributes: ["id", "type", "status", "latitude", "longitude"] },
    ],
    order: [["createdAt", "DESC"]],
  });
};