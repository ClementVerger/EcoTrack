"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // ============================================
    // TABLE: badges
    // ============================================
    if (!tables.includes("badges")) {
      await queryInterface.createTable("badges", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        code: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        icon: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        category: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: "general",
        },
        condition_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        condition_value: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        points_reward: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });
    } else {
      console.log("Table 'badges' already exists, skipping.");
    }

    // ============================================
    // TABLE: user_badges
    // ============================================
    if (!tables.includes("user_badges")) {
      await queryInterface.createTable("user_badges", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        badge_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "badges",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        earned_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

      await queryInterface.addIndex("user_badges", ["user_id", "badge_id"], {
        unique: true,
        name: "idx_user_badges_unique",
      });
    } else {
      console.log("Table 'user_badges' already exists, skipping.");
    }

    // ============================================
    // TABLE: levels
    // ============================================
    if (!tables.includes("levels")) {
      await queryInterface.createTable("levels", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        level_number: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true,
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        min_points: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        icon: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });
    } else {
      console.log("Table 'levels' already exists, skipping.");
    }

    // ============================================
    // Ajouter colonne level à users
    // ============================================
    const usersTable = await queryInterface.describeTable("users");
    if (!usersTable.level) {
      await queryInterface.addColumn("users", "level", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      });
    } else {
      console.log("Column 'level' already exists in 'users', skipping.");
    }

    // ============================================
    // TABLE: reward_history
    // ============================================
    if (!tables.includes("reward_history")) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_reward_history_type" AS ENUM ('badge', 'level_up', 'bonus');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      await queryInterface.createTable("reward_history", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        reward_type: {
          type: '"enum_reward_history_type"',
          allowNull: false,
        },
        reward_id: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        description: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        metadata: {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });

      await queryInterface.addIndex("reward_history", ["user_id"], {
        name: "idx_reward_history_user_id",
      });
    } else {
      console.log("Table 'reward_history' already exists, skipping.");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("reward_history");
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_reward_history_type";
    `);
    
    const usersTable = await queryInterface.describeTable("users").catch(() => null);
    if (usersTable?.level) {
      await queryInterface.removeColumn("users", "level");
    }
    
    await queryInterface.dropTable("levels");
    await queryInterface.dropTable("user_badges");
    await queryInterface.dropTable("badges");
  },
};