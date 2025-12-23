"use strict";

const crypto = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Générer UUID v4 avec crypto natif
    const uuidv4 = () => crypto.randomUUID();

    const now = new Date();

    // ============================================
    // Insérer les badges par défaut
    // ============================================
    await queryInterface.bulkInsert("badges", [
      // Badges de signalement
      {
        id: uuidv4(),
        code: "FIRST_REPORT",
        name: "Premier Pas",
        description: "Effectuer son premier signalement",
        icon: "🌱",
        category: "reports",
        condition_type: "reports_count",
        condition_value: 1,
        points_reward: 5,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: "REPORTER_10",
        name: "Éco-Citoyen",
        description: "Effectuer 10 signalements validés",
        icon: "🌿",
        category: "reports",
        condition_type: "reports_count",
        condition_value: 10,
        points_reward: 20,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: "REPORTER_50",
        name: "Gardien Vert",
        description: "Effectuer 50 signalements validés",
        icon: "🌳",
        category: "reports",
        condition_type: "reports_count",
        condition_value: 50,
        points_reward: 50,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: "REPORTER_100",
        name: "Champion Écologique",
        description: "Effectuer 100 signalements validés",
        icon: "🏆",
        category: "reports",
        condition_type: "reports_count",
        condition_value: 100,
        points_reward: 100,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      // Badges de points
      {
        id: uuidv4(),
        code: "POINTS_100",
        name: "Collectionneur Bronze",
        description: "Accumuler 100 points",
        icon: "🥉",
        category: "points",
        condition_type: "points_total",
        condition_value: 100,
        points_reward: 10,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: "POINTS_500",
        name: "Collectionneur Argent",
        description: "Accumuler 500 points",
        icon: "🥈",
        category: "points",
        condition_type: "points_total",
        condition_value: 500,
        points_reward: 25,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: "POINTS_1000",
        name: "Collectionneur Or",
        description: "Accumuler 1000 points",
        icon: "🥇",
        category: "points",
        condition_type: "points_total",
        condition_value: 1000,
        points_reward: 50,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      // Badges spéciaux
      {
        id: uuidv4(),
        code: "EARLY_ADOPTER",
        name: "Pionnier",
        description: "Faire partie des premiers utilisateurs",
        icon: "⭐",
        category: "special",
        condition_type: "manual",
        condition_value: 0,
        points_reward: 50,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: "STREAK_7",
        name: "Régularité",
        description: "Signaler pendant 7 jours consécutifs",
        icon: "🔥",
        category: "streak",
        condition_type: "streak_days",
        condition_value: 7,
        points_reward: 30,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    // ============================================
    // Insérer les niveaux par défaut
    // ============================================
    await queryInterface.bulkInsert("levels", [
      {
        id: uuidv4(),
        level_number: 1,
        name: "Débutant",
        min_points: 0,
        icon: "🌱",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 2,
        name: "Apprenti",
        min_points: 50,
        icon: "🌿",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 3,
        name: "Éco-Citoyen",
        min_points: 150,
        icon: "🌳",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 4,
        name: "Protecteur",
        min_points: 300,
        icon: "🛡️",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 5,
        name: "Gardien",
        min_points: 500,
        icon: "🦸",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 6,
        name: "Champion",
        min_points: 800,
        icon: "🏅",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 7,
        name: "Héros",
        min_points: 1200,
        icon: "🏆",
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        level_number: 8,
        name: "Légende",
        min_points: 2000,
        icon: "👑",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("levels", null, {});
    await queryInterface.bulkDelete("badges", null, {});
  },
};
