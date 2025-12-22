// src/models/container.model.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Container = sequelize.define(
    "Container",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      type: {
        type: DataTypes.ENUM("Verre", "Papier", "Plastique", "Ordures"),
        allowNull: false,
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

      status: {
        type: DataTypes.ENUM("vide", "presque_plein", "plein", "hors_service"),
        allowNull: false,
        defaultValue: "vide",
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 0,
          max: 100,
        },
      },

      fillLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "fill_level",
        validate: {
          min: 0,
          max: 100,
        },
      },

      zoneId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "zone_id",
        // La relation sera définie plus tard
        // references: {
        //   model: 'zones',
        //   key: 'id'
        // }
      },
    },
    {
      tableName: "containers",
      timestamps: true,
      underscored: true,
    }
  );

  // Les associations seront définies ici plus tard
  // Container.associate = (models) => {
  //   Container.belongsTo(models.Zone, {
  //     foreignKey: 'zoneId',
  //     as: 'zone'
  //   });
  //   Container.hasMany(models.Report, {
  //     foreignKey: 'containerId',
  //     as: 'reports'
  //   });
  // };

  return Container;
};
