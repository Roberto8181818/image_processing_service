"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    static associate(models) {
      Image.hasMany(models.Transformation, {
        foreignKey: "image_id",
        as: "transformations",
        onDelete: "CASCADE",
      });
      Image.hasOne(models.Thumbnail, {
        foreignKey: "image_id",
        as: "thumbnail",
        onDelete: "CASCADE",
      });
      Image.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "Users",
        onDelete: "CASCADE",
      });
    }
  }

  Image.init(
    {
      user_id: DataTypes.INTEGER,
      filename: DataTypes.STRING,
      path: DataTypes.STRING,
      url: DataTypes.STRING,
      metadata: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: "Image",
      tableName: "Images",
      underscored: true,
    }
  );

  return Image;
};
