"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Transformation extends Model {
    static associate(models) {
      Transformation.belongsTo(models.Image, {
        foreignKey: "image_id",
        as: "image",
        onDelete: "CASCADE",
      });
    }
  }

  Transformation.init(
    {
      image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Images",
          key: "id",
        },
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: { msg: "Debe ser una URL válida" },
        },
      },
      params: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Transformation",
      tableName: "Transformations",
      underscored: true,
      indexes: [{ fields: ["image_id"] }],
    }
  );

  return Transformation;
};
