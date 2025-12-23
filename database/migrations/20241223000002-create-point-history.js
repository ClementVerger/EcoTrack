"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer le type ENUM pour reason
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_point_history_reason" AS ENUM ('report_validated', 'bonus', 'penalty', 'other');
    `);

    // Créer la table point_history
    await queryInterface.createTable("point_history", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: '"enum_point_history_reason"',
        allowNull: false,
        defaultValue: "other",
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Index pour améliorer les performances des requêtes par utilisateur
    await queryInterface.addIndex("point_history", ["user_id"], {
      name: "idx_point_history_user_id",
    });

    // Index pour les requêtes par date
    await queryInterface.addIndex("point_history", ["created_at"], {
      name: "idx_point_history_created_at",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("point_history");
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_point_history_reason";
    `);
  },
};