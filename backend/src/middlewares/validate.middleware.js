const { check, validationResult } = require("express-validator");

// Fonction commune pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: "Validation échouée", errors: errors.array() });
  }
  next();
};

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
  handleValidationErrors,
];

const reportValidation = [
  check("containerId")
    .exists({ checkFalsy: true })
    .withMessage("L'ID du conteneur est requis")
    .isUUID()
    .withMessage("L'ID du conteneur doit être un UUID valide"),
  check("latitude")
    .exists({ checkNull: true })
    .withMessage("La latitude est requise")
    .isFloat({ min: -90, max: 90 })
    .withMessage("La latitude doit être comprise entre -90 et 90"),
  check("longitude")
    .exists({ checkNull: true })
    .withMessage("La longitude est requise")
    .isFloat({ min: -180, max: 180 })
    .withMessage("La longitude doit être comprise entre -180 et 180"),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  reportValidation,
};