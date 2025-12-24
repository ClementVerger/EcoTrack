// src/middlewares/admin.middleware.js
const { ForbiddenError, ErrorCodes } = require("../utils/errors");

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * Doit être utilisé APRÈS authMiddleware
 */
module.exports = (req, res, next) => {
  try {
    if (!req.user) {
      throw new ForbiddenError(
        "Authentification requise",
        ErrorCodes.FORBIDDEN
      );
    }

    if (req.user.role !== "admin") {
      throw new ForbiddenError(
        "Accès réservé aux administrateurs",
        ErrorCodes.FORBIDDEN
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
