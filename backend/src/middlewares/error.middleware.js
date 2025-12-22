// src/middlewares/error.middleware.js
const { AppError, ValidationError } = require("../utils/errors");

/**
 * Middleware de gestion centralisée des erreurs
 */
module.exports = (err, req, res, next) => {
  // Log de l'erreur (en dev uniquement pour le stack)
  if (process.env.NODE_ENV === "development") {
    console.error("❌ Error:", err);
  } else {
    console.error("❌ Error:", err.message);
  }

  // Erreurs Sequelize - Validation
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Erreur de validation",
        errors,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erreurs Sequelize - Contrainte unique
  if (err.name === "SequelizeUniqueConstraintError") {
    const field = err.errors?.[0]?.path || "unknown";
    return res.status(409).json({
      success: false,
      error: {
        code: "CONFLICT",
        message: `La valeur de "${field}" existe déjà`,
        field,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erreurs Sequelize - FK non trouvée
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FOREIGN_KEY_ERROR",
        message: "Référence vers une ressource inexistante",
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erreurs métier (AppError et dérivées)
  if (err instanceof AppError || err.isOperational) {
    const response = {
      success: false,
      error: {
        code: err.code || "ERROR",
        message: err.message,
        timestamp: new Date().toISOString(),
      },
    };

    // Ajouter les erreurs de validation si présentes
    if (err instanceof ValidationError && err.errors?.length) {
      response.error.errors = err.errors;
    }

    // Ajouter retryAfter pour les erreurs 429
    if (err.retryAfter) {
      response.error.retryAfter = err.retryAfter;
      res.set("Retry-After", err.retryAfter);
    }

    return res.status(err.statusCode).json(response);
  }

  // Erreurs avec statusCode personnalisé (legacy)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || "ERROR",
        message: err.message,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Erreurs non gérées (500)
  const isDev = process.env.NODE_ENV === "development";
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isDev ? err.message : "Une erreur interne est survenue",
      ...(isDev && { stack: err.stack }),
      timestamp: new Date().toISOString(),
    },
  });
};