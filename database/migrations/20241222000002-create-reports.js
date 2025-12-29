'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer le type ENUM (ignorer si existe déjà)
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_reports_type" AS ENUM ('CONTENEUR_PLEIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Créer la table reports
    await queryInterface.createTable('reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      container_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'containers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: {
        type: '"enum_reports_type"',
        allowNull: false,
        defaultValue: 'CONTENEUR_PLEIN',
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Index sur user_id (requêtes par utilisateur)
    await queryInterface.addIndex('reports', ['user_id'], {
      name: 'idx_reports_user_id',
    });

    // Index sur container_id (requêtes par conteneur)
    await queryInterface.addIndex('reports', ['container_id'], {
      name: 'idx_reports_container_id',
    });

    // Index sur created_at (tri chronologique)
    await queryInterface.addIndex('reports', ['created_at'], {
      name: 'idx_reports_created_at',
    });

    // Contraintes CHECK sur les coordonnées
    await queryInterface.sequelize.query(`
      ALTER TABLE reports 
      ADD CONSTRAINT chk_reports_latitude 
      CHECK (latitude >= -90 AND latitude <= 90);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE reports 
      ADD CONSTRAINT chk_reports_longitude 
      CHECK (longitude >= -180 AND longitude <= 180);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reports');

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_reports_type";
    `);
  },
};