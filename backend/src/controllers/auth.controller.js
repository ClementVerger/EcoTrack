const { User } = require("../config/database");

const EMAIL_ALREADY_USED = "Cet email est déjà utilisé";

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

exports.register = async (req, res, next) => {
  try {
    let { firstname, lastname, email, password } = req.body;

    // ✅ validations simples
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    firstname = firstname.trim();
    lastname = lastname.trim();
    email = email.trim().toLowerCase();

    if (firstname.length < 2 || lastname.length < 2) {
      return res.status(400).json({ message: "Nom/Prénom trop courts" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email invalide" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Mot de passe trop court (min 8)" });
    }

    // ✅ vérifier si email existe déjà
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: EMAIL_ALREADY_USED });
    }

    // ✅ création (hook hash automatiquement via password VIRTUAL)
    const user = await User.create({
      firstname,
      lastname,
      email,
      password,
    });

    return res.status(201).json({
      message: "Inscription réussie",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    // ✅ si doublon email malgré le check (race condition), renvoyer 409
    if (err?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: EMAIL_ALREADY_USED });
    }
    return next(err);
  }
};
