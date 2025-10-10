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
        as: "user",
        onDelete: "CASCADE",
      });
    }
  }

  Image.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
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
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Image",
      tableName: "Images",
      underscored: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["created_at"] },
      ],
    }
  );

  return Image;
};
