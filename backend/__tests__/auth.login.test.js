/* eslint-disable no-undef */
const request = require("supertest");

// Mocks
jest.mock("bcrypt", () => ({
  compare: jest.fn()
}));

jest.mock("../src/config/database", () => ({
  User: {
    findOne: jest.fn()
  },
  Sequelize: jest.fn(),
  sequelize: {
    sync: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock("../src/services/jwt.service", () => ({
  generateToken: jest.fn()
}));

const bcrypt = require("bcrypt");
const db = require("../src/config/database");
const { User } = db;
const jwtService = require("../src/services/jwt.service");
const app = require("../src/app");

describe("POST /auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockReset();
    bcrypt.compare.mockReset();
    jwtService.generateToken.mockReset();
  });

  test("✅ renvoie token + user (sans passwordHash) si bons identifiants", async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      firstname: "Clement",
      lastname: "Verger",
      email: "clement@test.fr",
      role: "user",
      isActive: true,
      createdAt: new Date(),
      passwordHash: "hashed_pw"
    });
    bcrypt.compare.mockResolvedValue(true);
    jwtService.generateToken.mockReturnValue("token-abc-123");

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "clement@test.fr", password: "SuperPassword123!" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("token-abc-123");
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("clement@test.fr");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(jwtService.generateToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, role: "user" })
    );
  });

  test("❌ 401 si mot de passe incorrect", async () => {
    User.findOne.mockResolvedValue({
      id: 1,
      passwordHash: "hashed_pw"
    });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "clement@test.fr", password: "badpass" });

    expect(res.status).toBe(401);
  });

  test("❌ 401 si utilisateur introuvable", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "unknown@test.fr", password: "whatever" });

    expect(res.status).toBe(401);
  });
});