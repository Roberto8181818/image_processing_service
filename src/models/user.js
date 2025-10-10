"use strict";
const { Model } = require("sequelize");
const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Image, {
        foreignKey: "user_id",
        as: "Images",
        onDelete: "CASCADE",
      });
    }

    generateToken() {
      return jwt.sign(
        { id: this.id, username: this.username },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1h" }
      );
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "El nombre de usuario no puede estar vacío" },
          len: { args: [3, 50], msg: "Debe tener entre 3 y 50 caracteres" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "La contraseña no puede estar vacía" },
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      underscored: true,
      indexes: [{ unique: true, fields: ["username"] }],
    }
  );

  return User;
};
