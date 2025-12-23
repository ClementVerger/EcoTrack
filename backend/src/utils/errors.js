// src/utils/errors.js

/**
 * Classe de base pour les erreurs métier
 */
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Distingue les erreurs métier des erreurs système

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur 400 - Bad Request
 * Payload invalide, données manquantes
 */
class BadRequestError extends AppError {
  constructor(message = "Requête invalide", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

/**
 * Erreur 401 - Unauthorized
 * JWT manquant, invalide ou expiré
 */
class UnauthorizedError extends AppError {
  constructor(message = "Non autorisé", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

/**
 * Erreur 403 - Forbidden
 * Accès refusé (permissions insuffisantes)
 */
class ForbiddenError extends AppError {
  constructor(message = "Accès interdit", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

/**
 * Erreur 404 - Not Found
 * Ressource non trouvée
 */
class NotFoundError extends AppError {
  constructor(message = "Ressource non trouvée", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

/**
 * Erreur 409 - Conflict
 * Conflit (ex: email déjà utilisé)
 */
class ConflictError extends AppError {
  constructor(message = "Conflit de données", code = "CONFLICT") {
    super(message, 409, code);
  }
}

/**
 * Erreur 422 - Unprocessable Entity
 * Validation échouée
 */
class ValidationError extends AppError {
  constructor(message = "Validation échouée", errors = [], code = "VALIDATION_ERROR") {
    super(message, 422, code);
    this.errors = errors;
  }
}

/**
 * Erreur 429 - Too Many Requests
 * Rate limiting, anti-doublon
 */
class TooManyRequestsError extends AppError {
  constructor(message = "Trop de requêtes", code = "TOO_MANY_REQUESTS", retryAfter = null) {
    super(message, 429, code);
    this.retryAfter = retryAfter; // En secondes
  }
}

// Codes d'erreur spécifiques à l'application
const ErrorCodes = {
  // Auth
  TOKEN_MISSING: "TOKEN_MISSING",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",

  // User
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_INACTIVE: "USER_INACTIVE",

  // Container
  CONTAINER_NOT_FOUND: "CONTAINER_NOT_FOUND",

  // Report
  REPORT_DUPLICATE: "REPORT_DUPLICATE",
  REPORT_NOT_FOUND: "REPORT_NOT_FOUND",
  REPORT_ALREADY_PROCESSED: "REPORT_ALREADY_PROCESSED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_UUID: "INVALID_UUID",
  INVALID_COORDINATES: "INVALID_COORDINATES",
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  ErrorCodes,
};