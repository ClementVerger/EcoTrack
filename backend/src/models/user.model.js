// src/models/user.model.js
const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

      firstname: { type: DataTypes.STRING(80), allowNull: false, validate: { len: [2, 80] } },
      lastname: { type: DataTypes.STRING(80), allowNull: false, validate: { len: [2, 80] } },

      email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },

      password: { type: DataTypes.VIRTUAL, allowNull: false, validate: { len: [8, 100] } },

      passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },

      role: { type: DataTypes.ENUM("user", "admin"), allowNull: false, defaultValue: "user" },

      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      hooks: {
         beforeValidate: async (user) => {
    if (user.password) {
      user.passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
    }
  },
        beforeUpdate: async (user) => {
          if (user.changed("password") && user.password) {
            user.passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
        },
      },
      defaultScope: { attributes: { exclude: ["passwordHash"] } },
    }
  );

  User.prototype.checkPassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
  };

  return User;
};
