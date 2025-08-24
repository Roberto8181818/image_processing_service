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
      image_id: DataTypes.INTEGER,
      filename: DataTypes.STRING,
      path: DataTypes.STRING,
      url: DataTypes.STRING,
      params: DataTypes.JSONB,
    },
    {
      sequelize,
      modelName: "Transformation",
      tableName: "Transformations",
      underscored: true,
    }
  );

  return Transformation;
};
