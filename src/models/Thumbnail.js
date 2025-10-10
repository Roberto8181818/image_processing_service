"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Thumbnail extends Model {
    static associate(models) {
      Thumbnail.belongsTo(models.Image, {
        foreignKey: "image_id",
        as: "image",
        onDelete: "CASCADE",
      });
    }
  }

  Thumbnail.init(
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
        validate: {
          notEmpty: { msg: "El nombre del archivo no puede estar vacío" },
        },
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
    },
    {
      sequelize,
      modelName: "Thumbnail",
      tableName: "Thumbnails",
      underscored: true,
      indexes: [{ fields: ["image_id"] }],
    }
  );

  return Thumbnail;
};
