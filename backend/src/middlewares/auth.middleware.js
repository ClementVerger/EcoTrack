const jwtService = require("../services/jwt.service");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.get("authorization") || req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header manquant" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Format Authorization invalide (attendu: Bearer <token>)" });
    }

    const token = parts[1];
    let payload;
    try {
      payload = jwtService.verifyToken(token);
    } catch (err) {
      if (err.code === "TOKEN_EXPIRED") {
        return res.status(401).json({ message: "Token expiré" });
      }
      if (err.code === "TOKEN_INVALID") {
        return res.status(401).json({ message: "Token invalide" });
      }
      return next(err);
    }

    req.user = { id: payload.userId, role: payload.role };
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return next(err);
  }
};