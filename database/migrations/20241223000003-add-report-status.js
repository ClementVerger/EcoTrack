"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer le type ENUM pour le status
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_reports_status" AS ENUM ('pending', 'validated', 'rejected');
    `);

    // Ajouter la colonne status
    await queryInterface.addColumn("reports", "status", {
      type: '"enum_reports_status"',
      allowNull: false,
      defaultValue: "pending",
    });

    // Ajouter la colonne validated_at
    await queryInterface.addColumn("reports", "validated_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Ajouter la colonne validated_by (admin qui a validé)
    await queryInterface.addColumn("reports", "validated_by", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    });

    // Index pour filtrer par status
    await queryInterface.addIndex("reports", ["status"], {
      name: "idx_reports_status",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("reports", "validated_by");
    await queryInterface.removeColumn("reports", "validated_at");
    await queryInterface.removeColumn("reports", "status");
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_reports_status";
    `);
  },
};