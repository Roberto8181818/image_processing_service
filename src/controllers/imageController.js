const path = require("path");
const sharp = require("sharp");
const { Image, Transformation, Thumbnail } = require("../models");
const Storage = require("../services/storageService");

const safeBasename = (filename) => {
  if (!filename) return "file";

  return path
    .parse(filename)
    .name.replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .toLowerCase();
};

module.exports = {
  upload: async (req, res) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }

      const userId = req.user?.id || "guest";
      const userDir = `user_${userId}`;
      const timestamp = Date.now();
      const ext = path.extname(req.file.originalname || "") || ".jpg";
      const baseName = safeBasename(
        req.file.originalname || `upload_${timestamp}`
      );
      const finalFilename = `${baseName}_${timestamp}${ext}`;
      const originalKey = `${userDir}/originals/${finalFilename}`;
      const thumbFilename = `${baseName}_thumb_${timestamp}.jpg`;
      const thumbKey = `${userDir}/thumbnails/${thumbFilename}`;

      const originalUrl = await Storage.uploadBuffer(
        originalKey,
        req.file.buffer,
        req.file.mimetype || "application/octet-stream"
      );

      const thumbBuffer = await sharp(req.file.buffer)
        .resize({ width: 200 })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbUrl = await Storage.uploadBuffer(
        thumbKey,
        thumbBuffer,
        "image/jpeg"
      );

      const newImage = await Image.create({
        user_id: req.user?.id || null,
        filename: finalFilename,
        path: originalKey,
        url: originalUrl,
        metadata: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          uploadedAt: new Date(),
        },
      });

      await Thumbnail.create({
        image_id: newImage.id,
        filename: thumbFilename,
        path: thumbKey,
        url: thumbUrl,
      });

      return res.status(201).json({
        message: "Imagen original subida y thumbnail creado",
        image: {
          image_id: newImage.id,
          filename: newImage.filename,
          url: newImage.url,
          metadata: newImage.metadata,
        },
        thumbnail: { filename: thumbFilename, url: thumbUrl },
      });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      return res.status(500).json({ error: error.message || "Error interno" });
    }
  },

  transform: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        resize,
        crop,
        rotate,
        // watermark,
        flip,
        mirror,
        compress,
        format,
        filter,
      } = req.body;

      const image = req.image || (await Image.findByPk(id));
      if (!image)
        return res.status(404).json({ message: "Imagen no encontrada" });

      const originalKey =
        image.path ||
        `user_${image.user_id || "guest"}/originals/${image.filename}`;
      const inputBuffer = await Storage.getFileBuffer(originalKey);

      if (!inputBuffer || inputBuffer.length === 0) {
        return res.status(404).json({
          message: "No se pudo obtener el archivo original desde el storage",
        });
      }

      let pipeline = sharp(inputBuffer);

      if (resize) {
        const w = resize.width ? Number(resize.width) : null;
        const h = resize.height ? Number(resize.height) : null;
        pipeline = pipeline.resize(w, h);
      }

      if (crop && typeof crop === "object") {
        pipeline = pipeline.extract({
          left: Math.round(crop.left || 0),
          top: Math.round(crop.top || 0),
          width: Math.round(crop.width),
          height: Math.round(crop.height),
        });
      }

      if (rotate) pipeline = pipeline.rotate(Number(rotate));
      if (flip) pipeline = pipeline.flip();
      if (mirror) pipeline = pipeline.flop();

      const applyFilter = (f, pl) => {
        switch (f) {
          case "grayscale":
            return pl.grayscale();
          case "sepia":
            return pl.modulate({ saturation: 0.3, hue: 30 });
          case "negate":
            return pl.negate();
          case "blur":
            return pl.blur(2);
          case "sharpen":
            return pl.sharpen();
          default:
            return pl;
        }
      };

      if (Array.isArray(filter)) {
        filter.forEach((f) => (pipeline = applyFilter(f, pipeline)));
      } else if (typeof filter === "string") {
        pipeline = applyFilter(filter, pipeline);
      }

      let outExt = ".jpg";
      let contentType = "image/jpeg";
      if (format) {
        const fmt = format.toLowerCase();
        outExt = `.${fmt}`;
        if (fmt === "jpeg" || fmt === "jpg") {
          pipeline = pipeline.jpeg({
            quality: compress ? Number(compress) : 80,
          });
          contentType = "image/jpeg";
        } else if (fmt === "png") {
          pipeline = pipeline.png();
          contentType = "image/png";
        } else if (fmt === "webp") {
          pipeline = pipeline.webp({
            quality: compress ? Number(compress) : 80,
          });
          contentType = "image/webp";
        } else {
          pipeline = pipeline.toFormat(fmt);
          contentType = `image/${fmt}`;
        }
      } else {
        pipeline = pipeline.jpeg({ quality: compress ? Number(compress) : 80 });
        contentType = "image/jpeg";
      }

      const outBuffer = await pipeline.toBuffer();

      const baseName = safeBasename(path.parse(originalKey).name);
      const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
      const outFilename = `edit_${timestampStr}${outExt}`;
      const editsDir = `user_${
        image.user_id || req.user?.id || "guest"
      }/edits/${baseName}`;
      const editKey = `${editsDir}/${outFilename}`;

      const editUrl = await Storage.uploadBuffer(
        editKey,
        outBuffer,
        contentType
      );

      const newTransformation = await Transformation.create({
        image_id: image.id,
        filename: outFilename,
        path: editKey,
        url: editUrl,
        params: {
          resize,
          crop,
          rotate,
          // watermark,
          flip,
          mirror,
          compress,
          format,
          filter,
        },
      });

      return res.json({
        message: "Transformación aplicada con éxito",
        transformation: {
          image_id: newTransformation.id,
          filename: newTransformation.filename,
          metadata: newTransformation.metadata,
          params: newTransformation.params,
        },
        url: editUrl,
      });
    } catch (error) {
      console.error("Error en transform:", error);
      return res.status(500).json({
        message: "Error al transformar la imagen",
        error: error.message,
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

      if (!image)
        return res.status(404).json({ error: "Imagen no encontrada" });

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
      console.error(error);
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
      console.error(error);
      res.status(500).json({ error: "Error al listar imágenes" });
    }
  },
};
