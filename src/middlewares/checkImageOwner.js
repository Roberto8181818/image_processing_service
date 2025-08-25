const { Image } = require("../models");

const checkImageOwner = async (req, res, next) => {
  try {
    const imageId = req.params.id;
    const image = await Image.findByPk(imageId);

    if (!image || image.user_id !== req.user.id) {
      return res.status(404).json({ message: "Imagen no encontrada" });
    }

    req.image = image;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verificando permisos" });
  }
};

module.exports = checkImageOwner;