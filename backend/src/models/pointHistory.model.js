// src/models/pointHistory.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PointHistory = sequelize.define(
    "PointHistory",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        references: {
          model: "users",
          key: "id",
        },
      },

      points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notZero(value) {
            if (value === 0) {
              throw new Error("Les points ne peuvent pas être égaux à zéro");
            }
          },
        },
      },

      reason: {
        type: DataTypes.ENUM("report_validated", "bonus", "penalty", "other"),
        allowNull: false,
        defaultValue: "other",
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "reference_id",
      },

      referenceType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: "reference_type",
      },
    },
    {
      tableName: "point_history",
      timestamps: true,
      underscored: true,
      updatedAt: false, // L'historique ne se modifie pas
    }
  );

  return PointHistory;
};