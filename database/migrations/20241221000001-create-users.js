"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier si la table existe déjà
    const tables = await queryInterface.showAllTables();
    if (tables.includes("users")) {
      console.log("Table 'users' already exists, skipping creation.");
      return;
    }

    // Créer le type ENUM pour role
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('user', 'admin');
    `);

    // Créer la table users
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      firstname: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      lastname: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: '"enum_users_role"',
        allowNull: false,
        defaultValue: "user",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Index sur email
    await queryInterface.addIndex("users", ["email"], {
      unique: true,
      name: "idx_users_email",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_users_role";
    `);
  },
};