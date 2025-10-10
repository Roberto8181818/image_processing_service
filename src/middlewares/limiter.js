const rateLimit = require("express-rate-limit");
const logger = require("../utils/logger");

// max 100 request by IP 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit excedido", {
      ip: req.ip,
      route: req.originalUrl,
    });
    res.status(429).json({
      error: "Demasiadas solicitudes. Intenta más tarde.",
    });
  },
});

// max 5 login attemps by IP 10 minutes
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    error: "Demasiados intentos fallidos. Espera unos minutos.",
  },
  handler: (req, res) => {
    logger.warn("Intentos de login excedidos", { ip: req.ip });
    res.status(429).json({
      error: "Demasiados intentos de inicio de sesión. Intenta más tarde.",
    });
  },
});

module.exports = {
  globalLimiter,
  loginLimiter,
};
