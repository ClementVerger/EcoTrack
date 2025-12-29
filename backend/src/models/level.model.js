// src/models/level.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Level = sequelize.define(
    "Level",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      levelNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "level_number",
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      minPoints: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "min_points",
      },
      icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: "levels",
      timestamps: true,
      underscored: true,
    }
  );

  return Level;
};