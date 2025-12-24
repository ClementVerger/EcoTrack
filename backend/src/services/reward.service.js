// src/services/reward.service.js
const { Op } = require("sequelize");
const db = require("../config/database");
const pointService = require("./point.service");
const analyticsService = require("./analytics.service");

/**
 * Vérifier et attribuer les badges éligibles à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [transaction] - Transaction Sequelize optionnelle
 * @returns {Promise<Array>} Liste des nouveaux badges obtenus
 */
const checkAndAwardBadges = async (userId, transaction = null) => {
  const user = await db.User.findByPk(userId, {
    include: [
      { association: "badges", attributes: ["id", "code"] },
      { association: "reports", where: { status: "validated" }, required: false },
    ],
    transaction,
  });

  if (!user) return [];

  // Récupérer les codes des badges déjà obtenus
  const earnedBadgeCodes = user.badges.map((b) => b.code);

  // Récupérer tous les badges actifs non encore obtenus
  const availableBadges = await db.Badge.findAll({
    where: {
      isActive: true,
      code: { [Op.notIn]: earnedBadgeCodes.length > 0 ? earnedBadgeCodes : [""] },
    },
    transaction,
  });

  const newBadges = [];
  const validatedReportsCount = user.reports ? user.reports.length : 0;

  for (const badge of availableBadges) {
    let isEligible = false;

    switch (badge.conditionType) {
      case "reports_count":
        isEligible = validatedReportsCount >= badge.conditionValue;
        break;

      case "points_total":
        isEligible = user.points >= badge.conditionValue;
        break;

      case "streak_days":
        // TODO: Implémenter la logique de streak
        isEligible = false;
        break;

      case "manual":
        // Badges attribués manuellement
        isEligible = false;
        break;

      default:
        isEligible = false;
    }

    if (isEligible) {
      // Attribuer le badge
      await db.UserBadge.create(
        {
          userId,
          badgeId: badge.id,
          earnedAt: new Date(),
        },
        { transaction }
      );

      // Enregistrer dans l'historique des récompenses
      await db.RewardHistory.create(
        {
          userId,
          rewardType: "badge",
          rewardId: badge.id,
          description: `Badge "${badge.name}" obtenu`,
          metadata: { badgeCode: badge.code, pointsReward: badge.pointsReward },
        },
        { transaction }
      );

      // Attribuer les points bonus du badge
      if (badge.pointsReward > 0) {
        await pointService.addPoints({
          userId,
          points: badge.pointsReward,
          reason: "bonus",
          description: `Bonus pour badge "${badge.name}"`,
          referenceId: badge.id,
          referenceType: "Badge",
          transaction,
        });
      }

      // Tracker l'événement analytics (async, non bloquant)
      analyticsService.trackBadgeEarned(userId, badge.code, badge.name, badge.pointsReward)
        .catch((err) => console.error("Analytics tracking error:", err));

      newBadges.push(badge);
    }
  }

  return newBadges;
};

/**
 * Vérifier et mettre à jour le niveau de l'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [transaction] - Transaction Sequelize optionnelle
 * @returns {Promise<Object|null>} Nouveau niveau si level up, null sinon
 */
const checkAndUpdateLevel = async (userId, transaction = null) => {
  const user = await db.User.findByPk(userId, { transaction });
  if (!user) return null;

  // Trouver le niveau correspondant aux points actuels
  const newLevel = await db.Level.findOne({
    where: {
      minPoints: { [Op.lte]: user.points },
    },
    order: [["levelNumber", "DESC"]],
    transaction,
  });

  if (!newLevel || newLevel.levelNumber <= user.level) {
    return null; // Pas de level up
  }

  const oldLevel = user.level;

  // Mettre à jour le niveau
  await user.update({ level: newLevel.levelNumber }, { transaction });

  // Enregistrer dans l'historique des récompenses
  await db.RewardHistory.create(
    {
      userId,
      rewardType: "level_up",
      rewardId: newLevel.id,
      description: `Passage au niveau ${newLevel.levelNumber} - ${newLevel.name}`,
      metadata: { oldLevel, newLevel: newLevel.levelNumber, levelName: newLevel.name },
    },
    { transaction }
  );

  // Tracker l'événement analytics (async, non bloquant)
  analyticsService.trackLevelUp(userId, newLevel.levelNumber, newLevel.name, oldLevel)
    .catch((err) => console.error("Analytics tracking error:", err));

  return newLevel;
};

/**
 * Traiter toutes les récompenses après une activité
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [transaction] - Transaction Sequelize optionnelle
 * @returns {Promise<Object>} Résumé des récompenses obtenues
 */
const processRewardsAfterActivity = async (userId, transaction = null) => {
  const newBadges = await checkAndAwardBadges(userId, transaction);
  const newLevel = await checkAndUpdateLevel(userId, transaction);

  return {
    badges: newBadges.map((b) => ({
      code: b.code,
      name: b.name,
      icon: b.icon,
      pointsReward: b.pointsReward,
    })),
    levelUp: newLevel
      ? {
          level: newLevel.levelNumber,
          name: newLevel.name,
          icon: newLevel.icon,
        }
      : null,
  };
};

/**
 * Attribuer manuellement un badge à un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} badgeCode - Code du badge
 * @returns {Promise<Object>} Badge attribué
 */
const awardBadgeManually = async (userId, badgeCode) => {
  const badge = await db.Badge.findOne({ where: { code: badgeCode } });
  if (!badge) {
    throw new Error(`Badge avec le code "${badgeCode}" non trouvé`);
  }

  // Vérifier si l'utilisateur a déjà ce badge
  const existing = await db.UserBadge.findOne({
    where: { userId, badgeId: badge.id },
  });

  if (existing) {
    throw new Error("L'utilisateur possède déjà ce badge");
  }

  const transaction = await db.sequelize.transaction();

  try {
    await db.UserBadge.create(
      { userId, badgeId: badge.id, earnedAt: new Date() },
      { transaction }
    );

    await db.RewardHistory.create(
      {
        userId,
        rewardType: "badge",
        rewardId: badge.id,
        description: `Badge "${badge.name}" attribué manuellement`,
        metadata: { badgeCode: badge.code, manual: true },
      },
      { transaction }
    );

    if (badge.pointsReward > 0) {
      await pointService.addPoints({
        userId,
        points: badge.pointsReward,
        reason: "bonus",
        description: `Bonus pour badge "${badge.name}"`,
        referenceId: badge.id,
        referenceType: "Badge",
        transaction,
      });
    }

    await transaction.commit();
    return badge;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Récupérer les badges d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des badges avec date d'obtention
 */
const getUserBadges = async (userId) => {
  return db.UserBadge.findAll({
    where: { userId },
    include: [
      {
        association: "badge",
        attributes: ["id", "code", "name", "description", "icon", "category"],
      },
    ],
    order: [["earnedAt", "DESC"]],
  });
};

/**
 * Récupérer tous les badges disponibles avec statut d'obtention
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste de tous les badges
 */
const getAllBadgesWithStatus = async (userId) => {
  const allBadges = await db.Badge.findAll({
    where: { isActive: true },
    order: [["category", "ASC"], ["conditionValue", "ASC"]],
  });

  const userBadges = await db.UserBadge.findAll({
    where: { userId },
    attributes: ["badgeId", "earnedAt"],
  });

  const userBadgeMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

  return allBadges.map((badge) => ({
    ...badge.toJSON(),
    earned: userBadgeMap.has(badge.id),
    earnedAt: userBadgeMap.get(badge.id) || null,
  }));
};

/**
 * Récupérer les informations de niveau d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Infos de niveau avec progression
 */
const getUserLevelInfo = async (userId) => {
  const user = await db.User.findByPk(userId, {
    attributes: ["points", "level"],
  });

  if (!user) return null;

  const currentLevel = await db.Level.findOne({
    where: { levelNumber: user.level },
  });

  const nextLevel = await db.Level.findOne({
    where: { levelNumber: user.level + 1 },
  });

  const progress = nextLevel
    ? {
        current: user.points - currentLevel.minPoints,
        required: nextLevel.minPoints - currentLevel.minPoints,
        percentage: Math.round(
          ((user.points - currentLevel.minPoints) /
            (nextLevel.minPoints - currentLevel.minPoints)) *
            100
        ),
      }
    : { current: 0, required: 0, percentage: 100 };

  return {
    level: user.level,
    name: currentLevel?.name,
    icon: currentLevel?.icon,
    points: user.points,
    nextLevel: nextLevel
      ? { level: nextLevel.levelNumber, name: nextLevel.name, minPoints: nextLevel.minPoints }
      : null,
    progress,
  };
};

/**
 * Récupérer l'historique des récompenses
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} [options] - Options de pagination
 * @returns {Promise<Object>} Historique avec count et rows
 */
const getRewardHistory = async (userId, { limit = 50, offset = 0 } = {}) => {
  return db.RewardHistory.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });
};

module.exports = {
  checkAndAwardBadges,
  checkAndUpdateLevel,
  processRewardsAfterActivity,
  awardBadgeManually,
  getUserBadges,
  getAllBadgesWithStatus,
  getUserLevelInfo,
  getRewardHistory,
};