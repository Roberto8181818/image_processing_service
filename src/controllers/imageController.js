const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { Image, Transformation, Thumbnail } = require("../models");

const ensureDir = async (dirPath) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};

const safeBasename = (filename) => {
  return path.parse(filename).name.replace(/\s+/g, "_");
};

module.exports = {
  upload: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }

      const userId = req.user?.id || "guest";
      const userDir = `user_${userId}`;

      const uploadsRoot = path.join(__dirname, "..", "..", "uploads");
      const userRoot = path.join(uploadsRoot, userDir);
      const originalsDir = path.join(userRoot, "originals");
      const thumbsDir = path.join(userRoot, "thumbnails");

      await ensureDir(originalsDir);
      await ensureDir(thumbsDir);

      const timestamp = Date.now();
      const ext =
        path.extname(req.file.originalname) || path.extname(req.file.filename) || ".jpg";
      const baseName = safeBasename(req.file.originalname || req.file.filename);
      const finalFilename = `${baseName}_${timestamp}${ext}`;
      const destPath = path.join(originalsDir, finalFilename);

      await fs.promises.rename(req.file.path, destPath);

      const thumbFilename = `${baseName}_thumb_${timestamp}.jpg`;
      const thumbPath = path.join(thumbsDir, thumbFilename);
      await sharp(destPath)
        .resize({ width: 200 })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);

      const baseUrl = `${req.protocol}://${req.get("host")}/uploads/${userDir}`;

      const newImage = await Image.create({
        user_id: req.user?.id || null,
        filename: finalFilename,
        path: path.relative(uploadsRoot, destPath),
        url: `${baseUrl}/originals/${finalFilename}`,
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
        path: path.relative(uploadsRoot, thumbPath),
        url: `${baseUrl}/thumbnails/${thumbFilename}`,
      });

      return res.status(201).json({
        message: "Imagen original guardada y thumbnail registrado",
        image: newImage,
      });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  transform: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        resize,
        crop,
        rotate,
        watermark,
        flip,
        mirror,
        compress,
        format,
        filter,
      } = req.body;

      const image = req.image;
      if (!image) {
        return res.status(404).json({ message: "Imagen no encontrada" });
      }

      if (req.user && image.user_id && req.user.id !== image.user_id) {
        return res.status(403).json({ message: "No tienes permisos para editar esta imagen" });
      }

      const metadata =
        typeof image.metadata === "string" ? JSON.parse(image.metadata) : image.metadata;

      const userId = image.user_id || req.user?.id || "guest";
      const userDir = `user_${userId}`;
      const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

      let inputPath;
      if (metadata && metadata.path) {
        inputPath = path.join(uploadsRoot, metadata.path);
      } else if (image.filename) {
        inputPath = path.join(uploadsRoot, userDir, "originals", image.filename);
      } else {
        return res
          .status(400)
          .json({ message: "No se encontró la ruta del archivo original" });
      }

      if (!fs.existsSync(inputPath)) {
        return res
          .status(404)
          .json({ message: `Archivo original no encontrado en el disco: ${inputPath}` });
      }

      const basename = safeBasename(path.parse(inputPath).name);
      const editsDir = path.join(uploadsRoot, userDir, "edits", basename);
      await ensureDir(editsDir);

      const outExt = format ? `.${format.toLowerCase()}` : path.extname(inputPath) || ".jpg";
      const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
      const outFilename = `edit_${timestampStr}${outExt}`;
      const outputPath = path.join(editsDir, outFilename);

      let pipeline = sharp(inputPath);

      if (resize) {
        const w = resize.width || null;
        const h = resize.height || null;
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
            console.log(`Filtro no reconocido: ${f}`);
            return pl;
        }
      };

      if (Array.isArray(filter)) {
        filter.forEach((f) => {
          pipeline = applyFilter(f, pipeline);
        });
      } else if (typeof filter === "string") {
        pipeline = applyFilter(filter, pipeline);
      }

      if (format) {
        const q = compress ? Number(compress) : 80;
        const fmt = format.toLowerCase();
        if (fmt === "jpeg" || fmt === "jpg") pipeline = pipeline.jpeg({ quality: q });
        else if (fmt === "png") pipeline = pipeline.png({ quality: q });
        else if (fmt === "webp") pipeline = pipeline.webp({ quality: q });
        else pipeline = pipeline.toFormat(fmt);
      }

      await pipeline.toFile(outputPath);

      const outUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${userDir}/edits/${basename}/${outFilename}`;
      const relativeOutPath = path.relative(uploadsRoot, outputPath);

      const newTransformation = await Transformation.create({
        image_id: image.id,
        filename: outFilename,
        path: relativeOutPath,
        url: outUrl,
        params: {
          resize,
          crop,
          rotate,
          watermark,
          flip,
          mirror,
          compress,
          format,
          filter,
        },
      });

      return res.json({
        message: "Transformación aplicada con éxito",
        transformation: newTransformation,
        url: outUrl,
        relativePath: relativeOutPath,
      });
    } catch (error) {
      console.error("Error en transform:", error);
      return res.status(500).json({
        message: "Error al transformar la imagen",
        error: error.message,
      });
    }
  },
};