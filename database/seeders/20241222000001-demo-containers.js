'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Générer UUID v4 avec crypto natif
    const uuidv4 = () => crypto.randomUUID();

    // Zones géographiques simulées (Paris et Île-de-France)
    const zones = [
      // Paris - Centre
      { id: uuidv4(), name: 'Paris - Île de la Cité', baseLat: 48.8530, baseLng: 2.3499 },
      { id: uuidv4(), name: 'Paris - Marais', baseLat: 48.8620, baseLng: 2.3630 },
      { id: uuidv4(), name: 'Paris - Champs-Élysées', baseLat: 48.8699, baseLng: 2.3073 },
      { id: uuidv4(), name: 'Paris - Montmartre', baseLat: 48.8867, baseLng: 2.3431 },
      { id: uuidv4(), name: 'Paris - Quartier Latin', baseLat: 48.8486, baseLng: 2.3431 },
      { id: uuidv4(), name: 'Paris - Belleville', baseLat: 48.8720, baseLng: 2.3879 },
      { id: uuidv4(), name: 'Paris - La Défense', baseLat: 48.8926, baseLng: 2.2450 },
      { id: uuidv4(), name: 'Paris - Bastille', baseLat: 48.8528, baseLng: 2.3687 },
      
      // Banlieue Proche
      { id: uuidv4(), name: 'Boulogne-Billancourt', baseLat: 48.8353, baseLng: 2.2395 },
      { id: uuidv4(), name: 'Neuilly-sur-Seine', baseLat: 48.8810, baseLng: 2.2651 },
      { id: uuidv4(), name: 'Saint-Denis', baseLat: 48.9356, baseLng: 2.3660 },
      { id: uuidv4(), name: 'Bussy-Saint-Georges', baseLat: 48.8323, baseLng: 2.7026 },
      { id: uuidv4(), name: 'Créteil', baseLat: 48.7876, baseLng: 2.4552 },
      { id: uuidv4(), name: 'Ivry-sur-Seine', baseLat: 48.8153, baseLng: 2.3867 },
      
      // Banlieue Étendue
      { id: uuidv4(), name: 'Versailles', baseLat: 48.8048, baseLng: 2.1301 },
      { id: uuidv4(), name: 'Meudon', baseLat: 48.8088, baseLng: 2.2290 },
      { id: uuidv4(), name: 'Melun', baseLat: 48.5407, baseLng: 2.6579 },
      { id: uuidv4(), name: 'Évry', baseLat: 48.6256, baseLng: 2.4430 },
      { id: uuidv4(), name: 'Provins', baseLat: 48.5592, baseLng: 3.3008 },
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
      const containersPerZone = 15 + Math.floor(Math.random() * 16);

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

    for (let i = 0; i < 20; i++) {
      const status = getRandomStatus();
      containers.push({
        id: uuidv4(),
        type: types[Math.floor(Math.random() * types.length)],
        latitude: 48.60 + randomOffset() * 5,
        longitude: 2.35 + randomOffset() * 5,
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