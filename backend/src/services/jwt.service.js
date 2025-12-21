const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "change_me";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const e = new Error("Token expiré");
      e.status = 401;
      e.code = "TOKEN_EXPIRED";
      throw e;
    }
    if (err.name === "JsonWebTokenError") {
      const e = new Error("Token invalide");
      e.status = 401;
      e.code = "TOKEN_INVALID";
      throw e;
    }
    const e = new Error("Erreur de vérification du token");
    e.status = 401;
    throw e;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};