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
      image_id: DataTypes.INTEGER,
      filename: DataTypes.STRING,
      path: DataTypes.STRING,
      url: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Thumbnail",
      tableName: "Thumbnails",
      underscored: true,
    }
  );

  return Thumbnail;
};