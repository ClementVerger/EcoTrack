/* eslint-disable no-undef */
const request = require("supertest");
const express = require("express");

// Mock jwt service
jest.mock("../src/services/jwt.service", () => ({
  verifyToken: jest.fn()
}));

const jwtService = require("../src/services/jwt.service");
const authMiddleware = require("../src/middlewares/auth.middleware");

function makeApp() {
  const a = express();
  a.get("/protected", authMiddleware, (req, res) =>
    res.json({ ok: true, userId: req.userId, role: req.user?.role })
  );
  return a;
}

describe("Auth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("✅ 200 si token valide", async () => {
    jwtService.verifyToken.mockReturnValue({ userId: 42, role: "user" });
    const app = makeApp();

    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer valid.token.here");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.userId).toBe(42);
  });

  test("❌ 401 si header Authorization manquant", async () => {
    const app = makeApp();
    const res = await request(app).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Authorization header manquant/i);
  });

  test("❌ 401 si token invalide", async () => {
    const err = new Error("Token invalide");
    err.code = "TOKEN_INVALID";
    jwtService.verifyToken.mockImplementation(() => { throw err; });

    const app = makeApp();
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer bad.token");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token invalide/i);
  });

  test("❌ 401 si token expiré", async () => {
    const err = new Error("Token expiré");
    err.code = "TOKEN_EXPIRED";
    jwtService.verifyToken.mockImplementation(() => { throw err; });

    const app = makeApp();
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer expired.token");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Token expiré/i);
  });
});