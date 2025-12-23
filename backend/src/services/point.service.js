// src/services/point.service.js
const db = require("../config/database");
const { NotFoundError, ErrorCodes } = require("../utils/errors");

// Points attribués pour un signalement validé
const POINTS_PER_VALID_REPORT = 10;

/**
 * Ajouter des points à un utilisateur et enregistrer dans l'historique
 * @param {Object} params - Paramètres
 * @param {string} params.userId - ID de l'utilisateur
 * @param {number} params.points - Nombre de points à ajouter (peut être négatif)
 * @param {string} params.reason - Raison (report_validated, bonus, penalty, other)
 * @param {string} [params.description] - Description optionnelle
 * @param {string} [params.referenceId] - ID de l'entité liée
 * @param {string} [params.referenceType] - Type de l'entité liée
 * @param {Object} [params.transaction] - Transaction Sequelize optionnelle
 * @returns {Promise<Object>} L'entrée d'historique créée
 */
const addPoints = async ({
  userId,
  points,
  reason,
  description = null,
  referenceId = null,
  referenceType = null,
  transaction = null,
}) => {
  const user = await db.User.findByPk(userId, { transaction });
  if (!user) {
    throw new NotFoundError("Utilisateur non trouvé", ErrorCodes.USER_NOT_FOUND);
  }

  // Mettre à jour les points de l'utilisateur
  const newPoints = Math.max(0, user.points + points); // Ne pas descendre en dessous de 0
  await user.update({ points: newPoints }, { transaction });

  // Créer l'entrée dans l'historique
  const historyEntry = await db.PointHistory.create(
    {
      userId,
      points,
      reason,
      description,
      referenceId,
      referenceType,
    },
    { transaction }
  );

  return historyEntry;
};

/**
 * Créditer les points pour un signalement validé
 * @param {string} userId - ID de l'utilisateur
 * @param {string} reportId - ID du signalement
 * @param {Object} [transaction] - Transaction Sequelize optionnelle
 * @returns {Promise<Object>} L'entrée d'historique créée
 */
const creditReportPoints = async (userId, reportId, transaction = null) => {
  return addPoints({
    userId,
    points: POINTS_PER_VALID_REPORT,
    reason: "report_validated",
    description: `Signalement #${reportId.slice(0, 8)} validé`,
    referenceId: reportId,
    referenceType: "Report",
    transaction,
  });
};

/**
 * Récupérer l'historique des points d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [options] - Options de pagination
 * @param {number} [options.limit=50] - Nombre max de résultats
 * @param {number} [options.offset=0] - Décalage pour pagination
 * @returns {Promise<Object>} Historique avec count et rows
 */
const getUserPointHistory = async (userId, { limit = 50, offset = 0 } = {}) => {
  return db.PointHistory.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
};

/**
 * Récupérer le solde de points d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<number>} Solde de points
 */
const getUserPoints = async (userId) => {
  const user = await db.User.findByPk(userId, {
    attributes: ["points"],
  });
  if (!user) {
    throw new NotFoundError("Utilisateur non trouvé", ErrorCodes.USER_NOT_FOUND);
  }
  return user.points;
};

module.exports = {
  POINTS_PER_VALID_REPORT,
  addPoints,
  creditReportPoints,
  getUserPointHistory,
  getUserPoints,
};