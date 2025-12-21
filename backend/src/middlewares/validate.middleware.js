const { check, validationResult } = require("express-validator");

const registerValidation = [
  check("firstname")
    .exists({ checkFalsy: true })
    .withMessage("Le prénom est requis")
    .isLength({ min: 2 })
    .withMessage("Le prénom doit contenir au moins 2 caractères")
    .trim(),
  check("lastname")
    .exists({ checkFalsy: true })
    .withMessage("Le nom est requis")
    .isLength({ min: 2 })
    .withMessage("Le nom doit contenir au moins 2 caractères")
    .trim(),
  check("email")
    .exists({ checkFalsy: true })
    .withMessage("L'email est requis")
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail(),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Le mot de passe est requis")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: "Validation échouée", errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  registerValidation,
};