"use strict";
const { Model } = require("sequelize");
const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
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
      username: DataTypes.STRING,
      password_hash: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};
