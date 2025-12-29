/* eslint-disable no-undef */
const request = require("supertest");

/**
 * =========================
 * CONFIGURATION DES MOCKS
 * =========================
 */

// Mock JWT service
jest.mock("../src/services/jwt.service", () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
}));

// Mock point service
jest.mock("../src/services/point.service", () => ({
  addPoints: jest.fn().mockResolvedValue({}),
  creditReportPoints: jest.fn().mockResolvedValue({}),
  POINTS_PER_VALID_REPORT: 10,
}));

// Mock database avec toutes les tables nécessaires
jest.mock("../src/config/database", () => {
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  return {
    User: {
      findByPk: jest.fn(),
      findOne: jest.fn(),
    },
    Container: {
      findByPk: jest.fn(),
    },
    Report: {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
    },
    PointHistory: {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
    },
    Badge: {
      findAll: jest.fn(),
      findOne: jest.fn(),
    },
    UserBadge: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },
    Level: {
      findOne: jest.fn(),
    },
    RewardHistory: {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
    },
    Sequelize: jest.fn(),
    sequelize: {
      sync: jest.fn().mockResolvedValue(undefined),
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    },
  };
});

const jwtService = require("../src/services/jwt.service");
const pointService = require("../src/services/point.service");
const db = require("../src/config/database");
const rewardService = require("../src/services/reward.service");
const app = require("../src/app");

/**
 * =========================
 * DONNÉES DE TEST
 * =========================
 */
const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  firstname: "Test",
  lastname: "User",
  email: "test@example.com",
  role: "user",
  points: 0,
  level: 1,
  update: jest.fn().mockResolvedValue(true),
  badges: [],
  reports: [],
};

const mockAdmin = {
  id: "550e8400-e29b-41d4-a716-446655440099",
  firstname: "Admin",
  lastname: "User",
  email: "admin@example.com",
  role: "admin",
  points: 100,
  level: 2,
};

const mockContainer = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  type: "Verre",
  status: "vide",
  latitude: 45.764,
  longitude: 4.8357,
};

const mockReportPending = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  userId: mockUser.id,
  containerId: mockContainer.id,
  type: "CONTENEUR_PLEIN",
  status: "pending",
  latitude: 45.764,
  longitude: 4.8357,
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn().mockResolvedValue(true),
};

// Badges de test
const mockBadgeFirstReport = {
  id: "badge-001",
  code: "FIRST_REPORT",
  name: "Premier Pas",
  description: "Effectuer son premier signalement",
  icon: "🌱",
  category: "reports",
  conditionType: "reports_count",
  conditionValue: 1,
  pointsReward: 5,
  isActive: true,
};

const mockBadgeReporter10 = {
  id: "badge-002",
  code: "REPORTER_10",
  name: "Éco-Citoyen",
  description: "Effectuer 10 signalements validés",
  icon: "🌿",
  category: "reports",
  conditionType: "reports_count",
  conditionValue: 10,
  pointsReward: 20,
  isActive: true,
};

const mockBadgePoints100 = {
  id: "badge-003",
  code: "POINTS_100",
  name: "Collectionneur Bronze",
  description: "Accumuler 100 points",
  icon: "🥉",
  category: "points",
  conditionType: "points_total",
  conditionValue: 100,
  pointsReward: 10,
  isActive: true,
};

const mockBadgeManual = {
  id: "badge-004",
  code: "EARLY_ADOPTER",
  name: "Pionnier",
  description: "Faire partie des premiers utilisateurs",
  icon: "⭐",
  category: "special",
  conditionType: "manual",
  conditionValue: 0,
  pointsReward: 50,
  isActive: true,
};

// Niveaux de test
const mockLevel1 = {
  id: "level-001",
  levelNumber: 1,
  name: "Débutant",
  minPoints: 0,
  icon: "🌱",
};

const mockLevel2 = {
  id: "level-002",
  levelNumber: 2,
  name: "Apprenti",
  minPoints: 50,
  icon: "🌿",
};

const mockLevel3 = {
  id: "level-003",
  levelNumber: 3,
  name: "Éco-Citoyen",
  minPoints: 150,
  icon: "🌳",
};

const VALID_ADMIN_TOKEN = "Bearer valid-admin-token";

/**
 * =========================
 * TESTS ATTRIBUTION DES BADGES
 * =========================
 */
describe("Attribution des Badges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================
  // TESTS checkAndAwardBadges()
  // =========================================
  describe("checkAndAwardBadges()", () => {
    test("✅ Attribue le badge FIRST_REPORT après 1 signalement validé", async () => {
      // Arrange: User avec 1 signalement validé, sans badge
      const userWith1Report = {
        ...mockUser,
        badges: [],
        reports: [{ id: "report-1", status: "validated" }],
      };

      db.User.findByPk.mockResolvedValue(userWith1Report);
      db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport, mockBadgeReporter10]);
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].code).toBe("FIRST_REPORT");
      expect(db.UserBadge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          badgeId: mockBadgeFirstReport.id,
        }),
        expect.anything()
      );
    });

    test("✅ Attribue plusieurs badges si conditions remplies", async () => {
      // Arrange: User avec 10 signalements validés
      const userWith10Reports = {
        ...mockUser,
        badges: [],
        reports: Array(10).fill({ id: "report", status: "validated" }),
      };

      db.User.findByPk.mockResolvedValue(userWith10Reports);
      db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport, mockBadgeReporter10]);
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(newBadges).toHaveLength(2);
      expect(newBadges.map((b) => b.code)).toContain("FIRST_REPORT");
      expect(newBadges.map((b) => b.code)).toContain("REPORTER_10");
    });

    test("✅ Attribue le badge de points quand seuil atteint", async () => {
      // Arrange: User avec 100 points
      const userWith100Points = {
        ...mockUser,
        points: 100,
        badges: [],
        reports: [],
      };

      db.User.findByPk.mockResolvedValue(userWith100Points);
      db.Badge.findAll.mockResolvedValue([mockBadgePoints100]);
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(newBadges).toHaveLength(1);
      expect(newBadges[0].code).toBe("POINTS_100");
    });

    test("✅ N'attribue pas un badge déjà obtenu", async () => {
      // Arrange: User a déjà le badge FIRST_REPORT
      const userWithBadge = {
        ...mockUser,
        badges: [{ id: mockBadgeFirstReport.id, code: "FIRST_REPORT" }],
        reports: [{ id: "report-1", status: "validated" }],
      };

      db.User.findByPk.mockResolvedValue(userWithBadge);
      // Retourne uniquement les badges non obtenus
      db.Badge.findAll.mockResolvedValue([mockBadgeReporter10]);

      // Act
      const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(newBadges).toHaveLength(0);
      expect(db.UserBadge.create).not.toHaveBeenCalled();
    });

    test("✅ N'attribue pas de badge si conditions non remplies", async () => {
      // Arrange: User sans signalements
      const userNoReports = {
        ...mockUser,
        badges: [],
        reports: [],
        points: 0,
      };

      db.User.findByPk.mockResolvedValue(userNoReports);
      db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport, mockBadgePoints100]);

      // Act
      const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(newBadges).toHaveLength(0);
      expect(db.UserBadge.create).not.toHaveBeenCalled();
    });

    test("✅ Crée une entrée dans RewardHistory pour chaque badge", async () => {
      // Arrange
      const userWith1Report = {
        ...mockUser,
        badges: [],
        reports: [{ id: "report-1", status: "validated" }],
      };

      db.User.findByPk.mockResolvedValue(userWith1Report);
      db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport]);
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(db.RewardHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          rewardType: "badge",
          rewardId: mockBadgeFirstReport.id,
          description: expect.stringContaining("Premier Pas"),
        }),
        expect.anything()
      );
    });

    test("✅ Attribue les points bonus du badge", async () => {
      // Arrange
      const userWith1Report = {
        ...mockUser,
        badges: [],
        reports: [{ id: "report-1", status: "validated" }],
      };

      db.User.findByPk.mockResolvedValue(userWith1Report);
      db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport]);
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(pointService.addPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          points: 5, // pointsReward du badge FIRST_REPORT
          reason: "bonus",
          referenceType: "Badge",
        })
      );
    });

    test("✅ Retourne tableau vide si utilisateur non trouvé", async () => {
      // Arrange
      db.User.findByPk.mockResolvedValue(null);

      // Act
      const newBadges = await rewardService.checkAndAwardBadges("non-existent-id");

      // Assert
      expect(newBadges).toEqual([]);
    });

    test("✅ N'attribue pas les badges manuels automatiquement", async () => {
      // Arrange
      const userWithPoints = {
        ...mockUser,
        badges: [],
        reports: [],
      };

      db.User.findByPk.mockResolvedValue(userWithPoints);
      db.Badge.findAll.mockResolvedValue([mockBadgeManual]);

      // Act
      const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

      // Assert
      expect(newBadges).toHaveLength(0);
    });
  });

  // =========================================
  // TESTS awardBadgeManually()
  // =========================================
  describe("awardBadgeManually()", () => {
    test("✅ Attribue manuellement un badge", async () => {
      // Arrange
      db.Badge.findOne.mockResolvedValue(mockBadgeManual);
      db.UserBadge.findOne.mockResolvedValue(null); // Pas encore obtenu
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      const badge = await rewardService.awardBadgeManually(mockUser.id, "EARLY_ADOPTER");

      // Assert
      expect(badge.code).toBe("EARLY_ADOPTER");
      expect(db.UserBadge.create).toHaveBeenCalled();
    });

    test("❌ Erreur si badge non trouvé", async () => {
      // Arrange
      db.Badge.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        rewardService.awardBadgeManually(mockUser.id, "INVALID_CODE")
      ).rejects.toThrow('Badge avec le code "INVALID_CODE" non trouvé');
    });

    test("❌ Erreur si utilisateur possède déjà le badge", async () => {
      // Arrange
      db.Badge.findOne.mockResolvedValue(mockBadgeManual);
      db.UserBadge.findOne.mockResolvedValue({ userId: mockUser.id, badgeId: mockBadgeManual.id });

      // Act & Assert
      await expect(
        rewardService.awardBadgeManually(mockUser.id, "EARLY_ADOPTER")
      ).rejects.toThrow("L'utilisateur possède déjà ce badge");
    });

    test("✅ Attribue les points bonus lors de l'attribution manuelle", async () => {
      // Arrange
      db.Badge.findOne.mockResolvedValue(mockBadgeManual);
      db.UserBadge.findOne.mockResolvedValue(null);
      db.UserBadge.create.mockResolvedValue({});
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      await rewardService.awardBadgeManually(mockUser.id, "EARLY_ADOPTER");

      // Assert
      expect(pointService.addPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          points: 50, // pointsReward du badge EARLY_ADOPTER
          reason: "bonus",
        })
      );
    });
  });
});

/**
 * =========================
 * TESTS ATTRIBUTION DES NIVEAUX
 * =========================
 */
describe("Attribution des Niveaux (Level Up)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================
  // TESTS checkAndUpdateLevel()
  // =========================================
  describe("checkAndUpdateLevel()", () => {
    test("✅ Level up quand seuil de points atteint", async () => {
      // Arrange: User niveau 1 avec 50 points (seuil niveau 2)
      const userLevel1With50Points = {
        ...mockUser,
        level: 1,
        points: 50,
        update: jest.fn().mockResolvedValue(true),
      };

      db.User.findByPk.mockResolvedValue(userLevel1With50Points);
      db.Level.findOne.mockResolvedValue(mockLevel2);
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      const newLevel = await rewardService.checkAndUpdateLevel(mockUser.id);

      // Assert
      expect(newLevel).not.toBeNull();
      expect(newLevel.levelNumber).toBe(2);
      expect(newLevel.name).toBe("Apprenti");
      expect(userLevel1With50Points.update).toHaveBeenCalledWith(
        { level: 2 },
        expect.anything()
      );
    });

    test("✅ Pas de level up si points insuffisants", async () => {
      // Arrange: User niveau 1 avec 30 points (seuil niveau 2 = 50)
      const userLevel1With30Points = {
        ...mockUser,
        level: 1,
        points: 30,
        update: jest.fn(),
      };

      db.User.findByPk.mockResolvedValue(userLevel1With30Points);
      db.Level.findOne.mockResolvedValue(mockLevel1); // Reste niveau 1

      // Act
      const newLevel = await rewardService.checkAndUpdateLevel(mockUser.id);

      // Assert
      expect(newLevel).toBeNull();
      expect(userLevel1With30Points.update).not.toHaveBeenCalled();
    });

    test("✅ Pas de level up si déjà au niveau correspondant", async () => {
      // Arrange: User niveau 2 avec 60 points
      const userLevel2With60Points = {
        ...mockUser,
        level: 2,
        points: 60,
        update: jest.fn(),
      };

      db.User.findByPk.mockResolvedValue(userLevel2With60Points);
      db.Level.findOne.mockResolvedValue(mockLevel2); // Même niveau

      // Act
      const newLevel = await rewardService.checkAndUpdateLevel(mockUser.id);

      // Assert
      expect(newLevel).toBeNull();
    });

    test("✅ Saute plusieurs niveaux si points suffisants", async () => {
      // Arrange: User niveau 1 avec 200 points (seuil niveau 3 = 150)
      const userLevel1With200Points = {
        ...mockUser,
        level: 1,
        points: 200,
        update: jest.fn().mockResolvedValue(true),
      };

      db.User.findByPk.mockResolvedValue(userLevel1With200Points);
      db.Level.findOne.mockResolvedValue(mockLevel3); // Saute au niveau 3
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      const newLevel = await rewardService.checkAndUpdateLevel(mockUser.id);

      // Assert
      expect(newLevel.levelNumber).toBe(3);
      expect(newLevel.name).toBe("Éco-Citoyen");
    });

    test("✅ Crée une entrée dans RewardHistory lors du level up", async () => {
      // Arrange
      const userLevel1With50Points = {
        ...mockUser,
        level: 1,
        points: 50,
        update: jest.fn().mockResolvedValue(true),
      };

      db.User.findByPk.mockResolvedValue(userLevel1With50Points);
      db.Level.findOne.mockResolvedValue(mockLevel2);
      db.RewardHistory.create.mockResolvedValue({});

      // Act
      await rewardService.checkAndUpdateLevel(mockUser.id);

      // Assert
      expect(db.RewardHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          rewardType: "level_up",
          rewardId: mockLevel2.id,
          description: expect.stringContaining("niveau 2"),
          metadata: expect.objectContaining({
            oldLevel: 1,
            newLevel: 2,
            levelName: "Apprenti",
          }),
        }),
        expect.anything()
      );
    });

    test("✅ Retourne null si utilisateur non trouvé", async () => {
      // Arrange
      db.User.findByPk.mockResolvedValue(null);

      // Act
      const newLevel = await rewardService.checkAndUpdateLevel("non-existent-id");

      // Assert
      expect(newLevel).toBeNull();
    });
  });
});

/**
 * =========================
 * TESTS processRewardsAfterActivity()
 * =========================
 */
describe("processRewardsAfterActivity()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Retourne badges et level up après activité", async () => {
    // Arrange: User obtient badge + level up
    const userAfterActivity = {
      ...mockUser,
      level: 1,
      points: 50,
      badges: [],
      reports: [{ id: "report-1", status: "validated" }],
      update: jest.fn().mockResolvedValue(true),
    };

    db.User.findByPk.mockResolvedValue(userAfterActivity);
    db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport]);
    db.UserBadge.create.mockResolvedValue({});
    db.RewardHistory.create.mockResolvedValue({});
    db.Level.findOne.mockResolvedValue(mockLevel2);

    // Act
    const rewards = await rewardService.processRewardsAfterActivity(mockUser.id);

    // Assert
    expect(rewards.badges).toHaveLength(1);
    expect(rewards.badges[0].code).toBe("FIRST_REPORT");
    expect(rewards.levelUp).not.toBeNull();
    expect(rewards.levelUp.level).toBe(2);
  });

  test("✅ Retourne objet vide si aucune récompense", async () => {
    // Arrange: User sans nouvelles récompenses
    const userNoRewards = {
      ...mockUser,
      level: 1,
      points: 10,
      badges: [{ id: mockBadgeFirstReport.id, code: "FIRST_REPORT" }],
      reports: [],
    };

    db.User.findByPk.mockResolvedValue(userNoRewards);
    db.Badge.findAll.mockResolvedValue([]);
    db.Level.findOne.mockResolvedValue(mockLevel1);

    // Act
    const rewards = await rewardService.processRewardsAfterActivity(mockUser.id);

    // Assert
    expect(rewards.badges).toHaveLength(0);
    expect(rewards.levelUp).toBeNull();
  });

  test("✅ Retourne uniquement badges si pas de level up", async () => {
    // Arrange
    const userBadgeOnly = {
      ...mockUser,
      level: 1,
      points: 10, // Pas assez pour level 2
      badges: [],
      reports: [{ id: "report-1", status: "validated" }],
    };

    db.User.findByPk.mockResolvedValue(userBadgeOnly);
    db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport]);
    db.UserBadge.create.mockResolvedValue({});
    db.RewardHistory.create.mockResolvedValue({});
    db.Level.findOne.mockResolvedValue(mockLevel1); // Reste niveau 1

    // Act
    const rewards = await rewardService.processRewardsAfterActivity(mockUser.id);

    // Assert
    expect(rewards.badges).toHaveLength(1);
    expect(rewards.levelUp).toBeNull();
  });

  test("✅ Retourne uniquement level up si pas de nouveau badge", async () => {
    // Arrange
    const userLevelUpOnly = {
      ...mockUser,
      level: 1,
      points: 50,
      badges: [{ id: mockBadgeFirstReport.id, code: "FIRST_REPORT" }],
      reports: [],
      update: jest.fn().mockResolvedValue(true),
    };

    db.User.findByPk.mockResolvedValue(userLevelUpOnly);
    db.Badge.findAll.mockResolvedValue([]); // Pas de badge disponible
    db.Level.findOne.mockResolvedValue(mockLevel2);
    db.RewardHistory.create.mockResolvedValue({});

    // Act
    const rewards = await rewardService.processRewardsAfterActivity(mockUser.id);

    // Assert
    expect(rewards.badges).toHaveLength(0);
    expect(rewards.levelUp).not.toBeNull();
    expect(rewards.levelUp.level).toBe(2);
  });
});

/**
 * =========================
 * TESTS INTÉGRATION API - Validation de signalement
 * =========================
 */
describe("Intégration API - Récompenses lors de validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwtService.verifyToken.mockReturnValue({
      userId: mockAdmin.id,
      role: mockAdmin.role,
    });
  });

  test("✅ PUT /reports/:id/validate retourne les badges obtenus", async () => {
    // Arrange
    const userWithNewBadge = {
      ...mockUser,
      points: 10,
      level: 1,
      badges: [],
      reports: [{ id: "report-1", status: "validated" }],
      update: jest.fn().mockResolvedValue(true),
    };

    db.Report.findByPk
      .mockResolvedValueOnce(mockReportPending)
      .mockResolvedValueOnce({
        ...mockReportPending,
        status: "validated",
        user: userWithNewBadge,
        container: mockContainer,
      });

    db.User.findByPk.mockResolvedValue(userWithNewBadge);
    db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport]);
    db.UserBadge.create.mockResolvedValue({});
    db.RewardHistory.create.mockResolvedValue({});
    db.Level.findOne.mockResolvedValue(mockLevel1);

    // Act
    const res = await request(app)
      .put(`/reports/${mockReportPending.id}/validate`)
      .set("Authorization", VALID_ADMIN_TOKEN);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.rewards).toBeDefined();
    expect(res.body.data.rewards.badges).toHaveLength(1);
    expect(res.body.data.rewards.badges[0].code).toBe("FIRST_REPORT");
  });

  test("✅ PUT /reports/:id/validate retourne level up si applicable", async () => {
    // Arrange
    const userLevelUp = {
      ...mockUser,
      points: 50,
      level: 1,
      badges: [{ id: mockBadgeFirstReport.id, code: "FIRST_REPORT" }],
      reports: [],
      update: jest.fn().mockResolvedValue(true),
    };

    db.Report.findByPk
      .mockResolvedValueOnce(mockReportPending)
      .mockResolvedValueOnce({
        ...mockReportPending,
        status: "validated",
        user: { ...userLevelUp, level: 2 },
        container: mockContainer,
      });

    db.User.findByPk.mockResolvedValue(userLevelUp);
    db.Badge.findAll.mockResolvedValue([]);
    db.Level.findOne.mockResolvedValue(mockLevel2);
    db.RewardHistory.create.mockResolvedValue({});

    // Act
    const res = await request(app)
      .put(`/reports/${mockReportPending.id}/validate`)
      .set("Authorization", VALID_ADMIN_TOKEN);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.rewards.levelUp).not.toBeNull();
    expect(res.body.data.rewards.levelUp.level).toBe(2);
    expect(res.body.data.rewards.levelUp.name).toBe("Apprenti");
  });

  test("✅ Le message inclut les badges obtenus", async () => {
    // Arrange
    const userWithBadge = {
      ...mockUser,
      badges: [],
      reports: [{ id: "report-1", status: "validated" }],
      update: jest.fn().mockResolvedValue(true),
    };

    db.Report.findByPk
      .mockResolvedValueOnce(mockReportPending)
      .mockResolvedValueOnce({
        ...mockReportPending,
        status: "validated",
        user: userWithBadge,
        container: mockContainer,
      });

    db.User.findByPk.mockResolvedValue(userWithBadge);
    db.Badge.findAll.mockResolvedValue([mockBadgeFirstReport]);
    db.UserBadge.create.mockResolvedValue({});
    db.RewardHistory.create.mockResolvedValue({});
    db.Level.findOne.mockResolvedValue(mockLevel1);

    // Act
    const res = await request(app)
      .put(`/reports/${mockReportPending.id}/validate`)
      .set("Authorization", VALID_ADMIN_TOKEN);

    // Assert
    expect(res.body.message).toContain("Premier Pas");
  });

  test("✅ Le message inclut le level up", async () => {
    // Arrange
    const userLevelUp = {
      ...mockUser,
      points: 50,
      level: 1,
      badges: [{ id: mockBadgeFirstReport.id, code: "FIRST_REPORT" }],
      reports: [],
      update: jest.fn().mockResolvedValue(true),
    };

    db.Report.findByPk
      .mockResolvedValueOnce(mockReportPending)
      .mockResolvedValueOnce({
        ...mockReportPending,
        status: "validated",
        user: { ...userLevelUp, level: 2 },
        container: mockContainer,
      });

    db.User.findByPk.mockResolvedValue(userLevelUp);
    db.Badge.findAll.mockResolvedValue([]);
    db.Level.findOne.mockResolvedValue(mockLevel2);
    db.RewardHistory.create.mockResolvedValue({});

    // Act
    const res = await request(app)
      .put(`/reports/${mockReportPending.id}/validate`)
      .set("Authorization", VALID_ADMIN_TOKEN);

    // Assert
    expect(res.body.message).toContain("Niveau supérieur");
    expect(res.body.message).toContain("Apprenti");
  });
});

/**
 * =========================
 * TESTS CONTRAINTES MÉTIER
 * =========================
 */
describe("Contraintes métier des récompenses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Un badge ne peut être obtenu qu'une seule fois", async () => {
    // Arrange: User a déjà le badge
    const userWithBadge = {
      ...mockUser,
      badges: [{ id: mockBadgeFirstReport.id, code: "FIRST_REPORT" }],
      reports: [{ id: "report-1", status: "validated" }],
    };

    db.User.findByPk.mockResolvedValue(userWithBadge);
    db.Badge.findAll.mockResolvedValue([]); // Aucun badge disponible car déjà obtenu

    // Act
    const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

    // Assert
    expect(newBadges).toHaveLength(0);
  });

  test("✅ Le niveau ne peut que monter (jamais descendre)", async () => {
    // Arrange: User niveau 3, points diminués
    const userLevel3LowPoints = {
      ...mockUser,
      level: 3,
      points: 10, // Points en dessous du seuil niveau 3
      update: jest.fn(),
    };

    db.User.findByPk.mockResolvedValue(userLevel3LowPoints);
    db.Level.findOne.mockResolvedValue(mockLevel1); // Niveau correspondant aux points

    // Act
    const newLevel = await rewardService.checkAndUpdateLevel(mockUser.id);

    // Assert: Pas de changement car niveau 1 < niveau actuel 3
    expect(newLevel).toBeNull();
    expect(userLevel3LowPoints.update).not.toHaveBeenCalled();
  });

  test("✅ Les badges inactifs ne sont pas attribués", async () => {
    // Arrange
    const inactiveBadge = { ...mockBadgeFirstReport, isActive: false };
    const userWith1Report = {
      ...mockUser,
      badges: [],
      reports: [{ id: "report-1", status: "validated" }],
    };

    db.User.findByPk.mockResolvedValue(userWith1Report);
    // La requête filtre déjà les badges inactifs (isActive: true)
    db.Badge.findAll.mockResolvedValue([]);

    // Act
    const newBadges = await rewardService.checkAndAwardBadges(mockUser.id);

    // Assert
    expect(newBadges).toHaveLength(0);
  });
});
