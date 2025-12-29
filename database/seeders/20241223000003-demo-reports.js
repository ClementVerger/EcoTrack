'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const uuidv4 = () => crypto.randomUUID();
    const now = new Date();

    // Récupérer les utilisateurs existants
    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE role = 'user' AND is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé. Exécutez d\'abord le seeder des users.');
      return;
    }

    // Récupérer l'admin pour la validation
    const [admin] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Récupérer les containers existants
    const containers = await queryInterface.sequelize.query(
      `SELECT id, latitude, longitude FROM containers LIMIT 20`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (containers.length === 0) {
      console.log('⚠️ Aucun container trouvé. Exécutez d\'abord le seeder des containers.');
      return;
    }

    const reports = [];

    // Créer des reports avec différents statuts
    const statuses = ['pending', 'validated', 'rejected'];

    // Générer des reports pour chaque utilisateur actif
    for (const user of users) {
      // Chaque utilisateur a entre 1 et 5 reports
      const numReports = 1 + Math.floor(Math.random() * 5);

      for (let i = 0; i < numReports; i++) {
        const container = containers[Math.floor(Math.random() * containers.length)];
        const statusIndex = Math.floor(Math.random() * 10);
        // Distribution : 40% pending, 40% validated, 20% rejected
        let status;
        if (statusIndex < 4) {
          status = 'pending';
        } else if (statusIndex < 8) {
          status = 'validated';
        } else {
          status = 'rejected';
        }

        // Légère variation de position par rapport au container
        const latOffset = (Math.random() - 0.5) * 0.0001;
        const lngOffset = (Math.random() - 0.5) * 0.0001;

        // Date de création aléatoire dans les 30 derniers jours
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const report = {
          id: uuidv4(),
          user_id: user.id,
          container_id: container.id,
          type: 'CONTENEUR_PLEIN',
          status: status,
          latitude: container.latitude + latOffset,
          longitude: container.longitude + lngOffset,
          validated_at: status === 'validated' ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
          validated_by: status === 'validated' && admin ? admin.id : null,
          created_at: createdAt,
          updated_at: status !== 'pending' ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : createdAt,
        };

        reports.push(report);
      }
    }

    // Ajouter quelques reports supplémentaires récents (aujourd'hui)
    for (let i = 0; i < 5; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const container = containers[Math.floor(Math.random() * containers.length)];

      reports.push({
        id: uuidv4(),
        user_id: user.id,
        container_id: container.id,
        type: 'CONTENEUR_PLEIN',
        status: 'pending',
        latitude: container.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: container.longitude + (Math.random() - 0.5) * 0.0001,
        validated_at: null,
        validated_by: null,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('reports', reports, {});

    // Comptage des statuts
    const statusCounts = reports.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ ${reports.length} signalements de démonstration créés:`);
    console.log(`   - En attente: ${statusCounts.pending || 0}`);
    console.log(`   - Validés: ${statusCounts.validated || 0}`);
    console.log(`   - Rejetés: ${statusCounts.rejected || 0}`);
  },

  async down(queryInterface, Sequelize) {
    // Supprimer tous les reports des utilisateurs de démonstration
    const demoEmails = [
      'marie.dupont@email.com',
      'jean.martin@email.com',
      'sophie.bernard@email.com',
      'lucas.petit@email.com',
      'emma.leroy@email.com',
      'julie.thomas@email.com',
    ];

    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email IN (:emails)`,
      {
        replacements: { emails: demoEmails },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (users.length > 0) {
      const userIds = users.map(u => u.id);
      await queryInterface.bulkDelete('reports', {
        user_id: { [Sequelize.Op.in]: userIds },
      }, {});
    }
  }
};
