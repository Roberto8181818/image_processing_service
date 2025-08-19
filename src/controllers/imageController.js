const { Image } = require("../models");

module.exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se recibió ninguna imagen" });
    }

    // Generando la URL con tu el servidor local temporalmente
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // Crear registro en la DB
    const newImage = await Image.create({
      user_id: req.user?.id || null,
      url: fileUrl,
      metadata: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
        path: req.file.path
      }
    });

    res.status(201).json({
      message: "Imagen subida y guardada en la DB",
      image: newImage
    });
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    res.status(500).json({ error: error.message });
  }
};
