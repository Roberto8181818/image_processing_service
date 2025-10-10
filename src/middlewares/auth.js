const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    logger.warn("Intento de acceso sin token", {
      ip: req.ip,
      route: req.originalUrl,
      method: req.method,
    });
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    logger.info("Token verificado correctamente", {
      userId: decoded.id,
      route: req.originalUrl,
      method: req.method,
    });
    next();
  } catch (error){
    logger.warn("Token inválido o expirado", {
      message: error.message,
      ip: req.ip,
      route: req.originalUrl,
      method: req.method,
    });
    return res.status(401).json({ error: "Invalid token" });
  }
};
