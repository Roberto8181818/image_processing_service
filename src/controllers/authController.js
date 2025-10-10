const logger = require("../utils/logger");
const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const isUser = await User.findOne({ where: { username } });

    if (isUser) {
      logger.warn(
        `Intento de registro con username no disponible: ${username}`
      );
      return res
        .status(400)
        .json({ success: false, error: "username no disponible" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET
    );

    logger.info(`Nuevo usuario registrado: ${username} (ID: ${user.id})`);
    res.status(201).json({ success: true, data: token });
  } catch (err) {
    logger.error(`Error en registro de usuario: ${err.message}`);
    res.status(500).json({ success: false, error: "Error en el registro" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      logger.warn(`Intento de login con usuario inexistente: ${username}`);
      return res
        .status(404)
        .json({ success: false, error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn(`Intento de login fallido para usuario: ${username}`);
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET
    );

    logger.info(`Usuario autenticado correctamente: ${username}`);
    res.status(200).json({ success: true, token });
  } catch (err) {
    logger.error(`Error en login de usuario: ${err.message}`);
    res
      .status(500)
      .json({ success: false, error: "Error en el inicio de sesión" });
  }
};
