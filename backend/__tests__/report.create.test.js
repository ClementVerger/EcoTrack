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

// Mock database
jest.mock("../src/config/database", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Container: {
    findByPk: jest.fn(),
  },
  Report: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Sequelize: jest.fn(),
  sequelize: {
    sync: jest.fn().mockResolvedValue(undefined),
  },
}));

const jwtService = require("../src/services/jwt.service");
const db = require("../src/config/database");
const app = require("../src/app");

/**
 * =========================
 * DONNÉES DE TEST (UUIDs valides)
 * =========================
 */
const mockUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  firstname: "Test",
  lastname: "User",
  email: "test@example.com",
  role: "user",
};

const mockContainer = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  type: "Verre",
  status: "vide",
  latitude: 45.764,
  longitude: 4.8357,
};

const mockReport = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  userId: mockUser.id,
  containerId: mockContainer.id,
  type: "CONTENEUR_PLEIN",
  latitude: 45.764,
  longitude: 4.8357,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: mockUser,
  container: mockContainer,
};

const validPayload = {
  containerId: "550e8400-e29b-41d4-a716-446655440001", // UUID valide
  latitude: 45.764,
  longitude: 4.8357,
};

const VALID_TOKEN = "Bearer valid-jwt-token";

/**
 * =========================
 * TESTS POST /reports
 * =========================
 */
describe("POST /reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Par défaut : JWT valide
    jwtService.verifyToken.mockReturnValue({
      userId: mockUser.id,
      role: mockUser.role,
    });
  });

  // =========================================
  // TESTS DE CRÉATION VALIDE
  // =========================================
  describe("Création valide", () => {
    test("✅ 201 - Crée un signalement avec payload valide", async () => {
      // Arrange
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null); // Pas de doublon
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      // Act
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Signalement créé avec succès");
      expect(res.body.data.report).toBeDefined();
      expect(res.body.data.report.id).toBe(mockReport.id);
    });

    test("✅ userId est extrait du JWT (pas du body)", async () => {
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null);
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          ...validPayload,
          userId: "hacker-trying-to-spoof",
        });

      expect(db.Report.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
        })
      );
    });
  });

  // =========================================
  // TESTS JWT (401)
  // =========================================
  describe("JWT - Authentification", () => {
    test("❌ 401 - Token absent", async () => {
      const res = await request(app).post("/reports").send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("TOKEN_MISSING");
    });

    test("❌ 401 - Token invalide (format)", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", "InvalidFormat token")
        .send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("TOKEN_INVALID");
    });

    test("❌ 401 - Token expiré", async () => {
      jwtService.verifyToken.mockImplementation(() => {
        const error = new Error("Token expired");
        error.code = "TOKEN_EXPIRED";
        throw error;
      });

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("TOKEN_EXPIRED");
    });

    test("❌ 401 - Token invalide (signature)", async () => {
      jwtService.verifyToken.mockImplementation(() => {
        const error = new Error("Invalid token");
        error.code = "TOKEN_INVALID";
        throw error;
      });

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("TOKEN_INVALID");
    });
  });

  // =========================================
  // TESTS CONTENEUR INEXISTANT (404)
  // =========================================
  describe("Conteneur inexistant", () => {
    test("❌ 404 - Conteneur non trouvé", async () => {
      db.Container.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONTAINER_NOT_FOUND");
      expect(res.body.error.message).toBe("Conteneur non trouvé");
    });
  });

  // =========================================
  // TESTS DOUBLON < 1H (429)
  // =========================================
  describe("Anti-doublon (< 1h)", () => {
    test("❌ 429 - Signalement en doublon", async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const existingReport = {
        ...mockReport,
        createdAt: thirtyMinutesAgo,
      };

      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(existingReport);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("REPORT_DUPLICATE");
      expect(res.body.error.message).toContain("déjà signalé");
      expect(res.body.error.retryAfter).toBeDefined();
    });

    test("✅ 201 - Même conteneur, utilisateur différent", async () => {
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null);
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(201);
    });

    test("✅ 201 - Même user/container mais > 1h", async () => {
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null);
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send(validPayload);

      expect(res.status).toBe(201);
    });
  });

  // =========================================
  // TESTS VALIDATION PAYLOAD (422)
  // =========================================
  describe("Validation du payload", () => {
    test("❌ 422 - containerId manquant", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          latitude: 45.764,
          longitude: 4.8357,
        });

      expect(res.status).toBe(422);
      expect(res.body.message).toBe("Validation échouée");
    });

    test("❌ 422 - containerId invalide (pas UUID)", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: "not-a-uuid",
          latitude: 45.764,
          longitude: 4.8357,
        });

      expect(res.status).toBe(422);
    });

    test("❌ 422 - latitude manquante", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          longitude: 4.8357,
        });

      expect(res.status).toBe(422);
    });

    test("❌ 422 - longitude manquante", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: 45.764,
        });

      expect(res.status).toBe(422);
    });

    test("❌ 422 - latitude hors limites (> 90)", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: 91,
          longitude: 4.8357,
        });

      expect(res.status).toBe(422);
    });

    test("❌ 422 - latitude hors limites (< -90)", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: -91,
          longitude: 4.8357,
        });

      expect(res.status).toBe(422);
    });

    test("❌ 422 - longitude hors limites (> 180)", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: 45.764,
          longitude: 181,
        });

      expect(res.status).toBe(422);
    });

    test("❌ 422 - longitude hors limites (< -180)", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: 45.764,
          longitude: -181,
        });

      expect(res.status).toBe(422);
    });
  });

  // =========================================
  // TESTS EDGE CASES
  // =========================================
  describe("Edge cases", () => {
    test("✅ Accepte latitude = 0, longitude = 0", async () => {
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null);
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: 0,
          longitude: 0,
        });

      expect(res.status).toBe(201);
    });

    test("✅ Accepte coordonnées limites (-90, -180)", async () => {
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null);
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: -90,
          longitude: -180,
        });

      expect(res.status).toBe(201);
    });

    test("✅ Accepte coordonnées limites (90, 180)", async () => {
      db.Container.findByPk.mockResolvedValue(mockContainer);
      db.Report.findOne.mockResolvedValue(null);
      db.Report.create.mockResolvedValue(mockReport);
      db.Report.findByPk.mockResolvedValue(mockReport);

      const res = await request(app)
        .post("/reports")
        .set("Authorization", VALID_TOKEN)
        .send({
          containerId: validPayload.containerId,
          latitude: 90,
          longitude: 180,
        });

      expect(res.status).toBe(201);
    });
  });
});