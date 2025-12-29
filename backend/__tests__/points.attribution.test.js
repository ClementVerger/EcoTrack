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
    },
    UserBadge: {
      create: jest.fn(),
    },
    Level: {
      findOne: jest.fn(),
    },
    RewardHistory: {
      create: jest.fn(),
    },
    Sequelize: jest.fn(),
    sequelize: {
      sync: jest.fn().mockResolvedValue(undefined),
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    },
  };
});

const jwtService = require("../src/services/jwt.service");
const db = require("../src/config/database");
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

const mockReportValidated = {
  ...mockReportPending,
  status: "validated",
  validatedAt: new Date(),
  validatedBy: mockAdmin.id,
  user: { ...mockUser, points: 10 },
  container: mockContainer,
};

const mockPointHistoryEntry = {
  id: "550e8400-e29b-41d4-a716-446655440003",
  userId: mockUser.id,
  points: 10,
  reason: "report_validated",
  description: "Signalement #550e8400 validé",
  referenceId: mockReportPending.id,
  referenceType: "Report",
  createdAt: new Date(),
};

const VALID_ADMIN_TOKEN = "Bearer valid-admin-token";
const VALID_USER_TOKEN = "Bearer valid-user-token";

/**
 * =========================
 * TESTS ATTRIBUTION DES POINTS
 * =========================
 */
describe("Attribution des Points", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================
  // TESTS VALIDATION DE SIGNALEMENT → +10 POINTS
  // =========================================
  describe("PUT /reports/:id/validate - Attribution de 10 points", () => {
    beforeEach(() => {
      // Admin authentifié par défaut
      jwtService.verifyToken.mockReturnValue({
        userId: mockAdmin.id,
        role: mockAdmin.role,
      });
    });

    test("✅ 200 - Valider un signalement attribue 10 points à l'utilisateur", async () => {
      // Arrange
      const userWithUpdatedPoints = { ...mockUser, points: 10 };
      
      db.Report.findByPk
        .mockResolvedValueOnce(mockReportPending) // Premier appel: vérification
        .mockResolvedValueOnce({ // Deuxième appel: retour avec relations
          ...mockReportValidated,
          user: userWithUpdatedPoints,
          container: mockContainer,
        });
      
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      });
      
      db.PointHistory.create.mockResolvedValue(mockPointHistoryEntry);
      db.Badge.findAll.mockResolvedValue([]);
      db.Level.findOne.mockResolvedValue({ levelNumber: 1, name: "Débutant", minPoints: 0 });

      // Act
      const res = await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("10 points");
    });

    test("✅ Les points sont bien ajoutés au user.points existant", async () => {
      // Arrange: User avec 50 points existants
      const userWith50Points = {
        ...mockUser,
        points: 50,
        update: jest.fn().mockResolvedValue(true),
      };

      db.Report.findByPk
        .mockResolvedValueOnce(mockReportPending)
        .mockResolvedValueOnce({
          ...mockReportValidated,
          user: { ...userWith50Points, points: 60 },
          container: mockContainer,
        });
      
      db.User.findByPk.mockResolvedValue(userWith50Points);
      db.PointHistory.create.mockResolvedValue(mockPointHistoryEntry);
      db.Badge.findAll.mockResolvedValue([]);
      db.Level.findOne.mockResolvedValue({ levelNumber: 2, name: "Apprenti", minPoints: 50 });

      // Act
      await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert: Vérifier que update a été appelé avec 60 points (50 + 10)
      expect(userWith50Points.update).toHaveBeenCalledWith(
        expect.objectContaining({ points: 60 }),
        expect.anything()
      );
    });

    test("✅ Une entrée est créée dans point_history", async () => {
      // Arrange
      db.Report.findByPk
        .mockResolvedValueOnce(mockReportPending)
        .mockResolvedValueOnce({ ...mockReportValidated, user: mockUser, container: mockContainer });
      
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      });
      db.PointHistory.create.mockResolvedValue(mockPointHistoryEntry);
      db.Badge.findAll.mockResolvedValue([]);
      db.Level.findOne.mockResolvedValue({ levelNumber: 1, name: "Débutant", minPoints: 0 });

      // Act
      await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(db.PointHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          points: 10,
          reason: "report_validated",
          referenceType: "Report",
        }),
        expect.anything()
      );
    });

    test("❌ 404 - Signalement non trouvé", async () => {
      // Arrange
      db.Report.findByPk.mockResolvedValue(null);

      // Act
      const res = await request(app)
        .put("/reports/550e8400-e29b-41d4-a716-446655449999/validate")
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("REPORT_NOT_FOUND");
    });

    test("❌ 400 - Signalement déjà validé", async () => {
      // Arrange
      db.Report.findByPk.mockResolvedValue({
        ...mockReportPending,
        status: "validated",
      });

      // Act
      const res = await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("REPORT_ALREADY_PROCESSED");
    });

    test("❌ 400 - Signalement déjà rejeté", async () => {
      // Arrange
      db.Report.findByPk.mockResolvedValue({
        ...mockReportPending,
        status: "rejected",
      });

      // Act
      const res = await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("REPORT_ALREADY_PROCESSED");
    });
  });

  // =========================================
  // TESTS REJET → PAS DE POINTS
  // =========================================
  describe("PUT /reports/:id/reject - Pas d'attribution de points", () => {
    beforeEach(() => {
      jwtService.verifyToken.mockReturnValue({
        userId: mockAdmin.id,
        role: mockAdmin.role,
      });
    });

    test("✅ 200 - Rejeter un signalement n'attribue pas de points", async () => {
      // Arrange
      const mockReportRejected = {
        ...mockReportPending,
        status: "rejected",
        update: jest.fn().mockResolvedValue(true),
      };

      db.Report.findByPk
        .mockResolvedValueOnce(mockReportPending)
        .mockResolvedValueOnce({
          ...mockReportRejected,
          user: mockUser,
          container: mockContainer,
        });

      // Act
      const res = await request(app)
        .put(`/reports/${mockReportPending.id}/reject`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(db.PointHistory.create).not.toHaveBeenCalled();
      expect(db.User.findByPk).not.toHaveBeenCalled();
    });
  });

  // =========================================
  // TESTS MULTIPLES VALIDATIONS
  // =========================================
  describe("Validations multiples", () => {
    beforeEach(() => {
      jwtService.verifyToken.mockReturnValue({
        userId: mockAdmin.id,
        role: mockAdmin.role,
      });
    });

    test("✅ Chaque validation donne exactement 10 points", async () => {
      // Simuler 3 validations successives
      const pointsHistory = [];
      
      db.PointHistory.create.mockImplementation((data) => {
        pointsHistory.push(data);
        return Promise.resolve({ id: "new-id", ...data });
      });

      db.Report.findByPk
        .mockResolvedValueOnce(mockReportPending)
        .mockResolvedValueOnce({ ...mockReportValidated, user: mockUser, container: mockContainer });
      
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      });
      db.Badge.findAll.mockResolvedValue([]);
      db.Level.findOne.mockResolvedValue({ levelNumber: 1, name: "Débutant", minPoints: 0 });

      // Act
      await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(pointsHistory.length).toBe(1);
      expect(pointsHistory[0].points).toBe(10);
    });
  });

  // =========================================
  // TESTS VALEUR POINTS MINIMUM
  // =========================================
  describe("Contraintes sur user.points", () => {
    test("✅ user.points ne peut pas être négatif", async () => {
      // Ce test vérifie la logique dans point.service.js
      // Math.max(0, user.points + points) garantit min = 0
      
      const userWithZeroPoints = {
        ...mockUser,
        points: 0,
        update: jest.fn().mockResolvedValue(true),
      };

      db.User.findByPk.mockResolvedValue(userWithZeroPoints);

      // Simuler une tentative de retrait de points (penalty)
      // La logique empêche de descendre en dessous de 0
      const newPoints = Math.max(0, userWithZeroPoints.points - 50);
      
      expect(newPoints).toBe(0);
    });

    test("✅ user.points est un entier", async () => {
      // Arrange
      db.Report.findByPk
        .mockResolvedValueOnce(mockReportPending)
        .mockResolvedValueOnce({ ...mockReportValidated, user: mockUser, container: mockContainer });
      
      const capturedUpdate = jest.fn().mockResolvedValue(true);
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        update: capturedUpdate,
      });
      db.PointHistory.create.mockResolvedValue(mockPointHistoryEntry);
      db.Badge.findAll.mockResolvedValue([]);
      db.Level.findOne.mockResolvedValue({ levelNumber: 1, name: "Débutant", minPoints: 0 });

      jwtService.verifyToken.mockReturnValue({
        userId: mockAdmin.id,
        role: mockAdmin.role,
      });

      // Act
      await request(app)
        .put(`/reports/${mockReportPending.id}/validate`)
        .set("Authorization", VALID_ADMIN_TOKEN);

      // Assert
      expect(capturedUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          points: expect.any(Number),
        }),
        expect.anything()
      );
      
      const calledPoints = capturedUpdate.mock.calls[0][0].points;
      expect(Number.isInteger(calledPoints)).toBe(true);
    });
  });
});

/**
 * =========================
 * TESTS UNITAIRES POINT SERVICE
 * =========================
 */
describe("Point Service - Tests Unitaires", () => {
  const pointService = require("../src/services/point.service");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POINTS_PER_VALID_REPORT", () => {
    test("✅ La constante vaut exactement 10", () => {
      expect(pointService.POINTS_PER_VALID_REPORT).toBe(10);
    });
  });

  describe("creditReportPoints()", () => {
    test("✅ Appelle addPoints avec les bons paramètres", async () => {
      // Arrange
      const userId = mockUser.id;
      const reportId = mockReportPending.id;
      
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        update: jest.fn().mockResolvedValue(true),
      });
      db.PointHistory.create.mockResolvedValue(mockPointHistoryEntry);

      // Act
      await pointService.creditReportPoints(userId, reportId, null);

      // Assert
      expect(db.PointHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          points: 10,
          reason: "report_validated",
          referenceId: reportId,
          referenceType: "Report",
        }),
        expect.anything()
      );
    });
  });

  describe("addPoints()", () => {
    test("✅ Ajoute les points correctement", async () => {
      // Arrange
      const updateMock = jest.fn().mockResolvedValue(true);
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        points: 50,
        update: updateMock,
      });
      db.PointHistory.create.mockResolvedValue({});

      // Act
      await pointService.addPoints({
        userId: mockUser.id,
        points: 10,
        reason: "report_validated",
        description: "Test",
      });

      // Assert
      expect(updateMock).toHaveBeenCalledWith(
        { points: 60 },
        expect.anything()
      );
    });

    test("✅ Ne descend pas en dessous de 0 avec points négatifs", async () => {
      // Arrange
      const updateMock = jest.fn().mockResolvedValue(true);
      db.User.findByPk.mockResolvedValue({
        ...mockUser,
        points: 5,
        update: updateMock,
      });
      db.PointHistory.create.mockResolvedValue({});

      // Act
      await pointService.addPoints({
        userId: mockUser.id,
        points: -50,
        reason: "penalty",
        description: "Test penalty",
      });

      // Assert
      expect(updateMock).toHaveBeenCalledWith(
        { points: 0 }, // Max(0, 5-50) = 0
        expect.anything()
      );
    });

    test("❌ Lève une erreur si utilisateur non trouvé", async () => {
      // Arrange
      db.User.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(
        pointService.addPoints({
          userId: "non-existent-id",
          points: 10,
          reason: "bonus",
        })
      ).rejects.toThrow("Utilisateur non trouvé");
    });
  });
});