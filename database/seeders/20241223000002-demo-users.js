'use strict';

const crypto = require('crypto');
// Charger bcrypt depuis le backend
const bcrypt = require('../../backend/node_modules/bcrypt');

const SALT_ROUNDS = 12;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const uuidv4 = () => crypto.randomUUID();
    const now = new Date();

    // Fonction pour hasher les mots de passe
    const hashPassword = async (password) => {
      return bcrypt.hash(password, SALT_ROUNDS);
    };

    // Utilisateurs de démonstration
    const users = [
      // Admin
      {
        id: uuidv4(),
        firstname: 'Admin',
        lastname: 'EcoTrack',
        email: 'admin@ecotrack.fr',
        password_hash: await hashPassword('Admin123!'),
        role: 'admin',
        is_active: true,
        points: 500,
        level: 5,
        created_at: now,
        updated_at: now,
      },
      // Utilisateurs actifs avec différents niveaux
      {
        id: uuidv4(),
        firstname: 'Marie',
        lastname: 'Dupont',
        email: 'marie.dupont@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: true,
        points: 150,
        level: 3,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        firstname: 'Jean',
        lastname: 'Martin',
        email: 'jean.martin@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: true,
        points: 80,
        level: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        firstname: 'Sophie',
        lastname: 'Bernard',
        email: 'sophie.bernard@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: true,
        points: 320,
        level: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        firstname: 'Lucas',
        lastname: 'Petit',
        email: 'lucas.petit@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: true,
        points: 25,
        level: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        firstname: 'Emma',
        lastname: 'Leroy',
        email: 'emma.leroy@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: true,
        points: 200,
        level: 3,
        created_at: now,
        updated_at: now,
      },
      // Utilisateur inactif
      {
        id: uuidv4(),
        firstname: 'Pierre',
        lastname: 'Moreau',
        email: 'pierre.moreau@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: false,
        points: 10,
        level: 1,
        created_at: now,
        updated_at: now,
      },
      // Nouvel utilisateur (0 points)
      {
        id: uuidv4(),
        firstname: 'Julie',
        lastname: 'Thomas',
        email: 'julie.thomas@email.com',
        password_hash: await hashPassword('Password123!'),
        role: 'user',
        is_active: true,
        points: 0,
        level: 1,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('users', users, {});

    console.log(`✅ ${users.length} utilisateurs de démonstration créés`);
  },

  async down(queryInterface, Sequelize) {
    // Supprimer tous les utilisateurs de démonstration par email
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@ecotrack.fr',
          'marie.dupont@email.com',
          'jean.martin@email.com',
          'sophie.bernard@email.com',
          'lucas.petit@email.com',
          'emma.leroy@email.com',
          'pierre.moreau@email.com',
          'julie.thomas@email.com',
        ],
      },
    }, {});
  }
};
