'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier si la table existe déjà
    const tables = await queryInterface.showAllTables();
    if (tables.includes('gamification_analytics')) {
      console.log('Table gamification_analytics existe déjà, skip.');
      return;
    }

    await queryInterface.createTable('gamification_analytics', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true, // Null pour les événements anonymes/système
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      event_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type d\'événement: points_earned, badge_earned, level_up, notification_displayed, notification_clicked, notification_dismissed',
      },
      event_category: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'gamification',
        comment: 'Catégorie: gamification, notification, engagement',
      },
      event_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Données additionnelles de l\'événement',
      },
      points_value: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Valeur en points si applicable',
      },
      badge_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Code du badge si applicable',
      },
      level_reached: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Niveau atteint si applicable',
      },
      source: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'backend',
        comment: 'Source: backend, frontend, api',
      },
      session_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'ID de session pour regrouper les événements',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Index pour les requêtes fréquentes
    await queryInterface.addIndex('gamification_analytics', ['user_id']);
    await queryInterface.addIndex('gamification_analytics', ['event_type']);
    await queryInterface.addIndex('gamification_analytics', ['event_category']);
    await queryInterface.addIndex('gamification_analytics', ['created_at']);
    await queryInterface.addIndex('gamification_analytics', ['user_id', 'event_type']);

    console.log('✅ Table gamification_analytics créée avec index');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gamification_analytics');
  }
};
