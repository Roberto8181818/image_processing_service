const logger = require("../utils/logger");
const { Image, Transformation } = require("../models");
const {
  uploadImage,
  transformImage,
} = require("../services/imageProcessingService");
const { validateImage } = require("../utils/validateImage");

module.exports = {
  upload: async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        logger.warn("Intento de subida sin archivo recibido", {
          userId: req.user?.id || "guest",
          route: req.originalUrl,
        });
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }
      const errorMsg = validateImage(req.file);

      if (errorMsg) {
        logger.warn("Validación fallida en subida de imagen", {
          userId: req.user?.id || "guest",
          error: errorMsg,
        });
        return res.status(400).json({ error: errorMsg });
      }

      const userId = req.user?.id || "guest";
      const { newImage, thumbUrl, thumbFilename } = await uploadImage(
        req.file,
        userId
      );
      logger.info("Imagen subida con éxito", {
        userId,
        imageId: newImage.id,
        filename: newImage.filename,
        thumbnail: thumbFilename,
      });
      res.status(201).json({
        message: "Imagen original subida y thumbnail creado",
        image: newImage,
        thumbnail: { filename: thumbFilename, url: thumbUrl },
      });
    } catch (error) {
      logger.error("Error al subir imagen", {
        userId: req.user?.id || "guest",
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "Error interno al subir imagen" });
    }
  },

  transform: async (req, res) => {
    try {
      const { id } = req.params;
      const image = await Image.findByPk(id);
      if (!image) {
        logger.warn("Transformación fallida: imagen no encontrada", {
          userId: req.user?.id || "guest",
          imageId: id,
        });
        return res.status(404).json({ message: "Imagen no encontrada" });
      }
      const { transformation, editUrl } = await transformImage(
        image,
        req.body,
        req.user?.id
      );
      logger.info("Transformación aplicada correctamente", {
        userId: req.user?.id || "guest",
        imageId: id,
        transformationId: transformation.id,
      });
      res.status(200).json({
        message: "Transformación aplicada con éxito",
        transformation,
        url: editUrl,
      });
    } catch (error) {
     logger.error("Error al transformar imagen", {
        userId: req.user?.id || "guest",
        imageId: req.params.id,
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        error: "Error al transformar la imagen",
        error_message: error.message,
      });
    }
  },
  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      const { includeTransformations } = req.query;

      const image = await Image.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
        include:
          includeTransformations === "true"
            ? [{ model: Transformation, as: "transformations" }]
            : [],
      });

      if (!image) {
        logger.warn("Intento de acceso a imagen inexistente", {
          userId: req.user.id,
          imageId: id,
        });
        return res.status(404).json({ error: "Imagen no encontrada" });
      }

      logger.info("Imagen obtenida exitosamente", {
        userId: req.user.id,
        imageId: id,
        includeTransformations: includeTransformations === "true",
      });

      res.json({
        success: true,
        data: {
          image_id: image.id,
          filename: image.filename,
          url: image.url,
          metadata: image.metadata,
          ...(image.transformations
            ? {
                transformations: image.transformations.map((t) => ({
                  transformation_id: t.id,
                  filename: t.filename,
                  url: t.url,
                  metadata: t.metadata,
                })),
              }
            : {}),
        },
      });
    } catch (error) {
      logger.error("Error al obtener imagen", {
        userId: req.user?.id,
        imageId: req.params.id,
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: "Error al buscar imagen" });
    }
  },

  list: async (req, res) => {
    try {
      const { includeTransformations, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const images = await Image.findAll({
        where: { user_id: req.user.id },
        limit: parseInt(limit),
        offset: parseInt(offset),
        include:
          includeTransformations === "true"
            ? [{ model: Transformation, as: "transformations" }]
            : [],
        order: [["createdAt", "DESC"]],
      });
      logger.info("Listado de imágenes generado", {
        userId: req.user.id,
        count: images.length,
        page,
        limit,
        includeTransformations: includeTransformations === "true",
      });
      res.json({
        success: true,
        count: images.length,
        data: images.map((t) => ({
          image_id: t.id,
          filename: t.filename,
          url: t.url,
          metadata: t.metadata,
          ...(t.transformations
            ? {
                transformations: t.transformations.map((tr) => ({
                  transformation_id: tr.id,
                  filename: tr.filename,
                  url: tr.url,
                  metadata: tr.metadata,
                })),
              }
            : {}),
        })),
      });
    } catch (error) {
      logger.error("Error al listar imágenes", {
        userId: req.user?.id,
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      res.status(500).json({ error: "Error al listar imágenes" });
    }
  },
};
