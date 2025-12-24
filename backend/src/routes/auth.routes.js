const express = require("express");
const router = express.Router();
const { register, login, getProfile } = require("../controllers/auth.controller");
const { registerValidation } = require("../middlewares/validate.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", registerValidation, register);
router.post("/login", login);

// Route protégée pour récupérer le profil utilisateur
router.get("/me", authMiddleware, getProfile);

module.exports = router;
