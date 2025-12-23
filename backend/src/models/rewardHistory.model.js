// src/models/rewardHistory.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RewardHistory = sequelize.define(
    "RewardHistory",
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
      rewardType: {
        type: DataTypes.ENUM("badge", "level_up", "bonus"),
        allowNull: false,
        field: "reward_type",
      },
      rewardId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "reward_id",
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "reward_history",
      timestamps: true,
      underscored: true,
      updatedAt: false,
    }
  );

  return RewardHistory;
};