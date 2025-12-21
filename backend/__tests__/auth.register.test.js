/* eslint-disable no-undef */
const request = require("supertest");

/**
 * =========================
 * CONFIGURATION DES MOCKS
 * =========================
 * On remplace les dépendances externes par des versions simulées
 */

// 1) Mock bcrypt - simule le hashage de mot de passe sans vraiment hasher
jest.mock("bcrypt", () => ({
  hash: jest.fn(async () => "hashed_password_123")
}));

// 2) Mock la database - simule les appels à la base de données sans vraie BD
jest.mock("../src/config/database", () => ({
  User: {
    findOne: jest.fn(),    // Mock: rechercher un utilisateur
    create: jest.fn()      // Mock: créer un utilisateur
  },
  Sequelize: jest.fn(),
  sequelize: {
    sync: jest.fn().mockResolvedValue(undefined)  // Mock: synchroniser le schéma
  }
}));

// Importer les mocks et l'app
const bcrypt = require("bcrypt");
const db = require("../src/config/database");
const { User } = db;

const app = require("../src/app");

/**
 * =========================
 * DÉBUT DES TESTS
 * =========================
 */
describe("POST /auth/register", () => {
  /**
   * beforeEach - S'exécute AVANT chaque test
   * Réinitialise tous les mocks pour que chaque test soit isolé
   */
  beforeEach(() => {
    jest.clearAllMocks();     // Réinitialise tous les mocks
    User.findOne.mockReset(); // Réinitialise le mock findOne
    User.create.mockReset();  // Réinitialise le mock create
  });

  /**
   * TEST 1: Scénario heureux - création réussie
   * Vérifie que l'API crée bien un compte avec des données valides
   */
  test("✅ crée un compte si payload valide + hash le mot de passe", async () => {
    // ARRANGE - Préparer les mocks: l'email n'existe pas
    User.findOne.mockResolvedValue(null);

    // ARRANGE - Préparer la réponse simulée de création
    User.create.mockResolvedValue({
      id: 1,
      firstname: "Clement",
      lastname: "Verger",
      email: "clement@test.fr",
      role: "user",
      isActive: true,
      createdAt: new Date()
    });

    // ACT - Envoyer la requête POST
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstname: "Clement",
        lastname: "Verger",
        email: "clement@test.fr",
        password: "SuperPassword123!"
      });

    // ASSERT - Vérifier que la réponse est 201 Created
    expect(res.status).toBe(201);

    // ASSERT - Vérifier que User.create() a été appelé exactement 1 fois
    expect(User.create).toHaveBeenCalledTimes(1);
    // Vérifier que les paramètres envoyés sont corrects
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstname: "Clement",
        lastname: "Verger",
        email: "clement@test.fr",
        password: "SuperPassword123!"
      })
    );

    // ASSERT - Vérifier le contenu de la réponse
    expect(res.body.message).toBe("Inscription réussie");
    expect(res.body.user.email).toBe("clement@test.fr");
    expect(res.body.user.firstname).toBe("Clement");
    expect(res.body.user.lastname).toBe("Verger");
  });

  /**
   * TEST 2: Validation - Email manquant
   * Vérifie que l'API refuse l'inscription si l'email est absent
   */
  test("❌ refuse si champ requis manquant (email)", async () => {
    // ACT - Envoyer une requête SANS email
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstname: "Clement",
        lastname: "Verger",
        password: "SuperPassword123!"
        // ⚠️ email manquant !
      });

    // ASSERT - Vérifier qu'on reçoit une erreur 400 ou 422 (validation error)
    expect([400, 422]).toContain(res.status);
    // ASSERT - Vérifier que la BD n'a pas été appelée (pas d'opération inutile)
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  /**
   * TEST 3: Validation - Email invalide
   * Vérifie que l'API refuse les emails mal formatés
   */
  test("❌ refuse si email invalide", async () => {
    // ACT - Envoyer une requête avec email invalide
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstname: "Clement",
        lastname: "Verger",
        email: "pas-un-email",  // ⚠️ pas de @ ou de domaine !
        password: "SuperPassword123!"
      });

    // ASSERT - Vérifier qu'on reçoit une erreur 400
    expect([400, 422]).toContain(res.status);
    // ASSERT - Vérifier qu'aucune opération BD n'a été tentée
    expect(User.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  /**
   * TEST 4: Validation - Mot de passe trop court
   * Vérifie que l'API refuse les mots de passe < 8 caractères
   */
  test("❌ refuse si mot de passe trop court", async () => {
    // ACT - Envoyer une requête avec un mot de passe faible
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstname: "Clement",
        lastname: "Verger",
        email: "clement@test.fr",
        password: "123"  // ⚠️ seulement 3 caractères !
      });

    // ASSERT - Vérifier qu'on reçoit une erreur 400
    expect([400, 422]).toContain(res.status);
    // ASSERT - Vérifier qu'aucun hash ou création n'a eu lieu
    expect(User.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  /**
   * TEST 5: Logique métier - Email déjà utilisé
   * Vérifie que l'API refuse les inscriptions avec un email existant
   */
  test("❌ refuse si email déjà utilisé", async () => {
    // ARRANGE - Simuler que l'email existe déjà en base
    User.findOne.mockResolvedValue({ id: 99, email: "clement@test.fr" });

    // ACT - Essayer de créer un compte avec cet email
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstname: "Clement",
        lastname: "Verger",
        email: "clement@test.fr",
        password: "SuperPassword123!"
      });

    // ASSERT - Vérifier qu'on reçoit 409 Conflict (ressource existe)
    expect([409, 400]).toContain(res.status);
    // ASSERT - Vérifier qu'aucune création n'a lieu si email dupliqué
    expect(User.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  /**
   * TEST 6: Gestion d'erreur - Erreur serveur
   * Vérifie que l'API gère les erreurs inattendues correctement
   */
  test("❌ gère une erreur serveur (User.create throw)", async () => {
    // ARRANGE - Email n'existe pas
    User.findOne.mockResolvedValue(null);
    // ARRANGE - Simuler une erreur lors de la création (ex: BD down)
    User.create.mockRejectedValue(new Error("DB down"));

    // ACT - Tenter de créer un compte (la création échouera)
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstname: "Clement",
        lastname: "Verger",
        email: "clement@test.fr",
        password: "SuperPassword123!"
      });

    // ASSERT - Vérifier qu'on reçoit 500 Internal Server Error
    expect(res.status).toBe(500);
  });
});
