"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("reports");

    // Créer le type ENUM si nécessaire
    if (!tableInfo.status) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_reports_status" AS ENUM ('pending', 'validated', 'rejected');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryInterface.addColumn("reports", "status", {
        type: '"enum_reports_status"',
        allowNull: false,
        defaultValue: "pending",
      });
    }

    if (!tableInfo.validated_at) {
      await queryInterface.addColumn("reports", "validated_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!tableInfo.validated_by) {
      await queryInterface.addColumn("reports", "validated_by", {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      });
    }

    // Index (ignore si existe)
    try {
      await queryInterface.addIndex("reports", ["status"], {
        name: "idx_reports_status",
      });
    } catch (e) {
      if (!e.message.includes("already exists")) throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("reports");

    if (tableInfo.validated_by) {
      await queryInterface.removeColumn("reports", "validated_by");
    }
    if (tableInfo.validated_at) {
      await queryInterface.removeColumn("reports", "validated_at");
    }
    if (tableInfo.status) {
      await queryInterface.removeColumn("reports", "status");
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_reports_status";
      `);
    }
  },
};