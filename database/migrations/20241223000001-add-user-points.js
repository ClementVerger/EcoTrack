"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("users");
    
    if (!tableInfo.points) {
      await queryInterface.addColumn("users", "points", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    } else {
      console.log("Column 'points' already exists in 'users', skipping.");
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("users");
    
    if (tableInfo.points) {
      await queryInterface.removeColumn("users", "points");
    }
  },
};