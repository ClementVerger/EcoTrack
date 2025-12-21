const express = require("express");
const router = express.Router();
const { register } = require("../controllers/auth.controller");
const { registerValidation } = require("../middlewares/validate.middleware");

router.post("/register", registerValidation, register);

module.exports = router;
