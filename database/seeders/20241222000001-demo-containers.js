'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Générer UUID v4 avec crypto natif
    const uuidv4 = () => crypto.randomUUID();

    // Zones géographiques simulées (Lyon et environs)
    const zones = [
      { id: uuidv4(), name: 'Centre-Ville', baseLat: 45.764, baseLng: 4.8357 },
      { id: uuidv4(), name: 'Part-Dieu', baseLat: 45.7606, baseLng: 4.8593 },
      { id: uuidv4(), name: 'Confluence', baseLat: 45.7426, baseLng: 4.8182 },
      { id: uuidv4(), name: 'Vieux Lyon', baseLat: 45.7622, baseLng: 4.8272 },
      { id: uuidv4(), name: 'Croix-Rousse', baseLat: 45.7748, baseLng: 4.8320 },
      { id: uuidv4(), name: 'Villeurbanne', baseLat: 45.7667, baseLng: 4.8795 },
    ];

    const types = ['Verre', 'Papier', 'Plastique', 'Ordures'];

    // Poids pour distribution réaliste des statuts
    const statusWeights = {
      'vide': 0.3,
      'presque_plein': 0.4,
      'plein': 0.25,
      'hors_service': 0.05,
    };

    const getRandomStatus = () => {
      const rand = Math.random();
      let cumulative = 0;
      for (const [status, weight] of Object.entries(statusWeights)) {
        cumulative += weight;
        if (rand < cumulative) return status;
      }
      return 'vide';
    };

    const getFillLevelForStatus = (status) => {
      switch (status) {
        case 'vide': return Math.floor(Math.random() * 20);
        case 'presque_plein': return 50 + Math.floor(Math.random() * 30);
        case 'plein': return 80 + Math.floor(Math.random() * 21);
        case 'hors_service': return Math.floor(Math.random() * 101);
        default: return 0;
      }
    };

    const randomOffset = () => (Math.random() - 0.5) * 0.01;

    const containers = [];
    const now = new Date();

    zones.forEach((zone) => {
      const containersPerZone = 10 + Math.floor(Math.random() * 6);

      for (let i = 0; i < containersPerZone; i++) {
        const status = getRandomStatus();
        const fillLevel = getFillLevelForStatus(status);

        containers.push({
          id: uuidv4(),
          type: types[Math.floor(Math.random() * types.length)],
          latitude: zone.baseLat + randomOffset(),
          longitude: zone.baseLng + randomOffset(),
          status: status,
          capacity: 100,
          fill_level: fillLevel,
          zone_id: zone.id,
          created_at: now,
          updated_at: now,
        });
      }
    });

    for (let i = 0; i < 5; i++) {
      const status = getRandomStatus();
      containers.push({
        id: uuidv4(),
        type: types[Math.floor(Math.random() * types.length)],
        latitude: 45.75 + randomOffset() * 3,
        longitude: 4.85 + randomOffset() * 3,
        status: status,
        capacity: 100,
        fill_level: getFillLevelForStatus(status),
        zone_id: null,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('containers', containers, {});

    console.log(`✅ ${containers.length} conteneurs créés dans ${zones.length} zones`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('containers', null, {});
  },
};