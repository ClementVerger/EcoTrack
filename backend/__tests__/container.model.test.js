/* eslint-disable no-undef */
const { Sequelize } = require('sequelize');
const buildContainer = require('../src/models/container.model');

/**
 * =========================
 * CONFIGURATION DE TEST
 * =========================
 * Utilise SQLite en mémoire pour tester le modèle sans vraie BD
 * Note: SQLite ne supporte pas les ENUM, ces validations sont testées différemment
 */
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
});

const Container = buildContainer(sequelize);

/**
 * =========================
 * DÉBUT DES TESTS
 * =========================
 */
describe('Container Model', () => {
  /**
   * beforeAll - S'exécute UNE FOIS avant tous les tests
   * Synchronise le modèle avec la base SQLite en mémoire
   */
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  /**
   * afterAll - S'exécute UNE FOIS après tous les tests
   * Ferme la connexion à la base de données
   */
  afterAll(async () => {
    await sequelize.close();
  });

  /**
   * beforeEach - S'exécute AVANT chaque test
   * Vide la table pour isoler chaque test
   */
  beforeEach(async () => {
    await Container.destroy({ where: {}, truncate: true });
  });

  // =========================================
  // TESTS DE CRÉATION VALIDE
  // =========================================
  describe('Création valide', () => {
    test('✅ crée un conteneur avec tous les champs requis', async () => {
      const containerData = {
        type: 'Verre',
        latitude: 45.764,
        longitude: 4.8357,
      };

      const container = await Container.create(containerData);

      expect(container.id).toBeDefined();
      expect(container.type).toBe('Verre');
      expect(container.latitude).toBe(45.764);
      expect(container.longitude).toBe(4.8357);
    });

    test('✅ crée un conteneur avec tous les champs optionnels', async () => {
      const zoneId = '550e8400-e29b-41d4-a716-446655440000';
      const containerData = {
        type: 'Papier',
        latitude: 45.7606,
        longitude: 4.8593,
        status: 'presque_plein',
        capacity: 80,
        fillLevel: 65,
        zoneId: zoneId,
      };

      const container = await Container.create(containerData);

      expect(container.type).toBe('Papier');
      expect(container.status).toBe('presque_plein');
      expect(container.capacity).toBe(80);
      expect(container.fillLevel).toBe(65);
      expect(container.zoneId).toBe(zoneId);
    });

    test('✅ accepte tous les types ENUM valides', async () => {
      const types = ['Verre', 'Papier', 'Plastique', 'Ordures'];

      for (const type of types) {
        const container = await Container.create({
          type,
          latitude: 45.0,
          longitude: 4.0,
        });
        expect(container.type).toBe(type);
      }
    });

    test('✅ accepte tous les statuts ENUM valides', async () => {
      const statuses = ['vide', 'presque_plein', 'plein', 'hors_service'];

      for (const status of statuses) {
        const container = await Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: 4.0,
          status,
        });
        expect(container.status).toBe(status);
      }
    });
  });

  // =========================================
  // TESTS DES VALEURS PAR DÉFAUT
  // =========================================
  describe('Valeurs par défaut', () => {
    test('✅ status par défaut = "vide"', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
      });

      expect(container.status).toBe('vide');
    });

    test('✅ capacity par défaut = 100', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
      });

      expect(container.capacity).toBe(100);
    });

    test('✅ fillLevel par défaut = 0', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
      });

      expect(container.fillLevel).toBe(0);
    });

    test('✅ zoneId par défaut = null', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
      });

      // SQLite retourne undefined au lieu de null pour les valeurs non définies
      expect(container.zoneId ?? null).toBeNull();
    });

    test('✅ génère automatiquement un UUID pour id', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
      });

      expect(container.id).toBeDefined();
      expect(typeof container.id).toBe('string');
      // Format UUID v4
      expect(container.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    test('✅ génère automatiquement createdAt et updatedAt', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
      });

      expect(container.createdAt).toBeInstanceOf(Date);
      expect(container.updatedAt).toBeInstanceOf(Date);
    });
  });

  // =========================================
  // TESTS DES CHAMPS REQUIS (ERREURS)
  // =========================================
  describe('Champs requis - Erreurs', () => {
    test('❌ échoue sans type', async () => {
      await expect(
        Container.create({
          latitude: 45.0,
          longitude: 4.0,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue sans latitude', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          longitude: 4.0,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue sans longitude', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
        })
      ).rejects.toThrow();
    });
  });

  // =========================================
  // TESTS DES ENUM - Définition du modèle
  // =========================================
  describe('ENUM - Définition du modèle', () => {
    // Note: SQLite ne supporte pas les ENUM au niveau DB
    // Ces tests vérifient que le modèle définit bien les valeurs autorisées

    test('✅ le modèle définit les types autorisés', () => {
      const typeAttribute = Container.rawAttributes.type;
      expect(typeAttribute.type.values).toEqual([
        'Verre',
        'Papier',
        'Plastique',
        'Ordures',
      ]);
    });

    test('✅ le modèle définit les statuts autorisés', () => {
      const statusAttribute = Container.rawAttributes.status;
      expect(statusAttribute.type.values).toEqual([
        'vide',
        'presque_plein',
        'plein',
        'hors_service',
      ]);
    });

    test('✅ type est obligatoire (allowNull: false)', () => {
      const typeAttribute = Container.rawAttributes.type;
      expect(typeAttribute.allowNull).toBe(false);
    });

    test('✅ status a une valeur par défaut', () => {
      const statusAttribute = Container.rawAttributes.status;
      expect(statusAttribute.defaultValue).toBe('vide');
    });
  });

  // =========================================
  // TESTS DES VALIDATIONS (ERREURS)
  // =========================================
  describe('Validations - Erreurs', () => {
    test('❌ échoue si latitude < -90', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: -91,
          longitude: 4.0,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si latitude > 90', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 91,
          longitude: 4.0,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si longitude < -180', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: -181,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si longitude > 180', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: 181,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si capacity < 0', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: 4.0,
          capacity: -1,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si capacity > 100', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: 4.0,
          capacity: 101,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si fillLevel < 0', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: 4.0,
          fillLevel: -1,
        })
      ).rejects.toThrow();
    });

    test('❌ échoue si fillLevel > 100', async () => {
      await expect(
        Container.create({
          type: 'Verre',
          latitude: 45.0,
          longitude: 4.0,
          fillLevel: 101,
        })
      ).rejects.toThrow();
    });
  });

  // =========================================
  // TESTS DES LIMITES (EDGE CASES)
  // =========================================
  describe('Valeurs limites (edge cases)', () => {
    test('✅ accepte latitude = -90 (pôle sud)', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: -90,
        longitude: 0,
      });
      expect(container.latitude).toBe(-90);
    });

    test('✅ accepte latitude = 90 (pôle nord)', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 90,
        longitude: 0,
      });
      expect(container.latitude).toBe(90);
    });

    test('✅ accepte longitude = -180', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 0,
        longitude: -180,
      });
      expect(container.longitude).toBe(-180);
    });

    test('✅ accepte longitude = 180', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 0,
        longitude: 180,
      });
      expect(container.longitude).toBe(180);
    });

    test('✅ accepte capacity = 0', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
        capacity: 0,
      });
      expect(container.capacity).toBe(0);
    });

    test('✅ accepte fillLevel = 100', async () => {
      const container = await Container.create({
        type: 'Verre',
        latitude: 45.0,
        longitude: 4.0,
        fillLevel: 100,
      });
      expect(container.fillLevel).toBe(100);
    });
  });

  // =========================================
  // TESTS DE LA STRUCTURE DU MODÈLE
  // =========================================
  describe('Structure du modèle', () => {
    test('✅ table name est "containers"', () => {
      expect(Container.tableName).toBe('containers');
    });

    test('✅ utilise underscored pour les colonnes', () => {
      expect(Container.options.underscored).toBe(true);
    });

    test('✅ fillLevel est mappé vers fill_level en DB', () => {
      const fillLevelAttr = Container.rawAttributes.fillLevel;
      expect(fillLevelAttr.field).toBe('fill_level');
    });

    test('✅ zoneId est mappé vers zone_id en DB', () => {
      const zoneIdAttr = Container.rawAttributes.zoneId;
      expect(zoneIdAttr.field).toBe('zone_id');
    });
  });
});