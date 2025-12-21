const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { registerValidation } = require("../middlewares/validate.middleware");

router.post("/register", registerValidation, register);
router.post("/login", login);


module.exports = router;
