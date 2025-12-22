const jwtService = require("../services/jwt.service");
const { UnauthorizedError, ErrorCodes } = require("../utils/errors");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.get("authorization") || req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError(
        "Token d'authentification requis",
        ErrorCodes.TOKEN_MISSING
      );
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedError(
        "Format d'autorisation invalide (attendu: Bearer <token>)",
        ErrorCodes.TOKEN_INVALID
      );
    }

    const token = parts[1];
    let payload;
    try {
      payload = jwtService.verifyToken(token);
    } catch (err) {
      if (err.code === "TOKEN_EXPIRED") {
        throw new UnauthorizedError("Token expiré", ErrorCodes.TOKEN_EXPIRED);
      }
      throw new UnauthorizedError("Token invalide", ErrorCodes.TOKEN_INVALID);
    }

    req.user = { id: payload.userId, role: payload.role };
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return next(err);
  }
};