// src/models/report.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Report = sequelize.define(
    "Report",
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
      },

      containerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "container_id",
      },

      type: {
        type: DataTypes.ENUM("CONTENEUR_PLEIN"),
        allowNull: false,
        defaultValue: "CONTENEUR_PLEIN",
      },

      status: {
        type: DataTypes.ENUM("pending", "validated", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      latitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: -90,
          max: 90,
        },
      },

      longitude: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: -180,
          max: 180,
        },
      },

      validatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "validated_at",
      },

      validatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "validated_by",
      },
    },
    {
      tableName: "reports",
      timestamps: true,
      underscored: true,
    }
  );

  return Report;
};