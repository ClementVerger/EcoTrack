// src/models/badge.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Badge = sequelize.define(
    "Badge",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "general",
      },
      conditionType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: "condition_type",
      },
      conditionValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "condition_value",
      },
      pointsReward: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "points_reward",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "badges",
      timestamps: true,
      underscored: true,
    }
  );

  return Badge;
};