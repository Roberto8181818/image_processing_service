const logger = require("../utils/logger");
const { Image } = require("../models");

const checkImageOwner = async (req, res, next) => {
  try {
    const imageId = req.params.id;
    const image = await Image.findByPk(imageId);

    if (!image) {
      logger.warn("Intento de acceso a imagen inexistente", {
        userId: req.user?.id,
        imageId,
        route: req.originalUrl,
        method: req.method,
      });
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    if (image.user_id !== req.user.id) {
      logger.warn("Intento de acceso o modificación no autorizado", {
        userId: req.user?.id,
        imageId,
        ownerId: image.user_id,
        route: req.originalUrl,
        method: req.method,
      });
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    req.image = image;
    next();
  } catch (error) {
    logger.error("Error verificando permisos de imagen", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      imageId: req.params.id,
      route: req.originalUrl,
      method: req.method,
    });
    res.status(500).json({ message: "Error verificando permisos" });
  }
};

module.exports = checkImageOwner;
