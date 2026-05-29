const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Notification",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      task_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      project_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: "Powiadomienie",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      actor_name: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      source_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "notifications",
      timestamps: false,
    }
  );
};