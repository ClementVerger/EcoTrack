'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Créer les types ENUM
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_containers_type" AS ENUM ('Verre', 'Papier', 'Plastique', 'Ordures');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_containers_status" AS ENUM ('vide', 'presque_plein', 'plein', 'hors_service');
    `);

    // Créer la table containers
    await queryInterface.createTable('containers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: '"enum_containers_type"',
        allowNull: false,
      },
      latitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      longitude: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      status: {
        type: '"enum_containers_status"',
        allowNull: false,
        defaultValue: 'vide',
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      fill_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      zone_id: {
        type: Sequelize.UUID,
        allowNull: true,
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

    // Index sur type (recherche par type de conteneur)
    await queryInterface.addIndex('containers', ['type'], {
      name: 'idx_containers_type',
    });

    // Index sur status (filtrage par état)
    await queryInterface.addIndex('containers', ['status'], {
      name: 'idx_containers_status',
    });

    // Index sur zone_id (requêtes par zone)
    await queryInterface.addIndex('containers', ['zone_id'], {
      name: 'idx_containers_zone_id',
    });

    // Index composite sur coordonnées GPS (recherche géographique)
    await queryInterface.addIndex('containers', ['latitude', 'longitude'], {
      name: 'idx_containers_location',
    });

    // Contraintes CHECK
    await queryInterface.sequelize.query(`
      ALTER TABLE containers 
      ADD CONSTRAINT chk_containers_latitude 
      CHECK (latitude >= -90 AND latitude <= 90);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE containers 
      ADD CONSTRAINT chk_containers_longitude 
      CHECK (longitude >= -180 AND longitude <= 180);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE containers 
      ADD CONSTRAINT chk_containers_capacity 
      CHECK (capacity >= 0 AND capacity <= 100);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE containers 
      ADD CONSTRAINT chk_containers_fill_level 
      CHECK (fill_level >= 0 AND fill_level <= 100);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('containers');

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_containers_type";
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_containers_status";
    `);
  },
};
