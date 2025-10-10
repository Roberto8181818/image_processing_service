const path = require("path");
const sharp = require("sharp");
const { sanitizeFilename } = require("../utils/sanitizeFileName");
const Storage = require("../services/storageService");
const { Image, Thumbnail, Transformation } = require("../models");
const { IMAGE_CONFIG } = require("../config/constants");
const { validateImage } = require("../utils/validateImage");
const logger = require("../utils/logger");

async function uploadImage(file, userId = "guest") {
  try {
    logger.info(`[uploadImage] Inicio de subida de imagen`, {
      userId,
      filename: file.originalname,
      size: file.size,
    });
    validateImage(file);

    const userDir = `user_${userId}`;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname || "") || ".jpg";
    const baseName = sanitizeFilename(
      file.originalname || `upload_${timestamp}`
    );
    const finalFilename = `${baseName}_${timestamp}${ext}`;
    const originalKey = `${userDir}/originals/${finalFilename}`;
    const thumbFilename = `${baseName}_thumb_${timestamp}.jpg`;
    const thumbKey = `${userDir}/thumbnails/${thumbFilename}`;

    logger.debug(`[uploadImage] Rutas generadas`, { originalKey, thumbKey });

    const originalUrl = await Storage.uploadBuffer(
      originalKey,
      file.buffer,
      file.mimetype || "application/octet-stream"
    );
    logger.info(`[uploadImage] Imagen original subida con éxito`, {
      originalUrl,
    });

    const thumbBuffer = await sharp(file.buffer)
      .resize({ width: IMAGE_CONFIG.THUMBNAIL_SIZE.width })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbUrl = await Storage.uploadBuffer(
      thumbKey,
      thumbBuffer,
      "image/jpeg"
    );
    logger.info(`[uploadImage] Thumbnail creado y subido`, { thumbUrl });

    const newImage = await Image.create({
      user_id: userId === "guest" ? null : userId,
      filename: finalFilename,
      path: originalKey,
      url: originalUrl,
      metadata: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
      },
    });

    await Thumbnail.create({
      image_id: newImage.id,
      filename: thumbFilename,
      path: thumbKey,
      url: thumbUrl,
    });

    logger.info(`[uploadImage] Imagen registrada en BD`, {
      imageId: newImage.id,
      filename: newImage.filename,
    });

    return { newImage, thumbUrl, thumbFilename };
  } catch (err) {
    logger.error(`[uploadImage] Error subiendo imagen`, {
      userId,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

async function transformImage(image, options = {}, userId = "guest") {
  try {
    logger.info("[transformImage] Inicio de transformación", {
      imageId: image.id,
      userId,
      options,
    });

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
    } = options;

    const originalKey =
      image.path ||
      `user_${image.user_id || "guest"}/originals/${image.filename}`;
    const inputBuffer = await Storage.getFileBuffer(originalKey);

    let pipeline = sharp(inputBuffer);

    if (resize) {
      pipeline = pipeline.resize(
        resize.width ? Number(resize.width) : null,
        resize.height ? Number(resize.height) : null
      );
      logger.debug(`[transformImage] resize aplicado`, resize);
    }
    if (crop) {
      pipeline = pipeline.extract({
        left: Math.round(crop.left || 0),
        top: Math.round(crop.top || 0),
        width: Math.round(crop.width),
        height: Math.round(crop.height),
      });
      logger.debug(`[transformImage] resize aplicado`, resize);
    }

    if (rotate) {
      pipeline = pipeline.rotate(Number(rotate));
      logger.debug(`[transformImage] rotate aplicado`, { rotate });
    }

    if (flip) {
      pipeline = pipeline.flip();
      logger.debug(`[transformImage] flip aplicado`);
    }

    if (mirror) {
      pipeline = pipeline.flop();
      logger.debug(`[transformImage] mirror aplicado`);
    }

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

    if (Array.isArray(filter))
      filter.forEach((f) => {
        pipeline = applyFilter(f, pipeline);
        logger.debug(`[transformImage] filtro aplicado`, { filter: f });
      });
    else if (typeof filter === "string") {
      pipeline = applyFilter(filter, pipeline);
      logger.debug(`[transformImage] filtro aplicado`, { filter });
    }

    let outExt = ".jpg";
    let contentType = "image/jpeg";
    if (format) {
      if (
        format &&
        !IMAGE_CONFIG.SUPPORTED_OUTPUT_FORMATS.includes(format.toLowerCase())
      ) {
        throw new Error("Formato de salida no soportado");
      }
      const fmt = format.toLowerCase();
      outExt = `.${fmt}`;
      if (fmt === "jpeg" || fmt === "jpg") {
        pipeline = pipeline.jpeg({ quality: compress ? Number(compress) : 80 });
      } else if (fmt === "png") {
        pipeline = pipeline.png();
        contentType = "image/png";
      } else if (fmt === "webp") {
        pipeline = pipeline.webp({ quality: compress ? Number(compress) : 80 });
        contentType = "image/webp";
      } else if (fmt === "avif") {
        pipeline = pipeline.avif({ quality: compress ? Number(compress) : 80 });
        contentType = "image/avif";
      }
      logger.debug(`[transformImage] formato cambiado`, { fmt });
    } else {
      pipeline = pipeline.jpeg({ quality: compress ? Number(compress) : 80 });
    }

    logger.info(`[transformImage] Generando salida final...`);
    const outBuffer = await pipeline.toBuffer();

    const baseName = sanitizeFilename(path.parse(originalKey).name);
    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
    const outFilename = `edit_${timestampStr}${outExt}`;
    const editsDir = `user_${image.user_id || userId}/edits/${baseName}`;
    const editKey = `${editsDir}/${outFilename}`;

    const editUrl = await Storage.uploadBuffer(editKey, outBuffer, contentType);

    const transformation = await Transformation.create({
      image_id: image.id,
      filename: outFilename,
      path: editKey,
      url: editUrl,
      params: options,
    });

    logger.info(`[transformImage] Transformación completada`, {
      transformationId: transformation.id,
      imageId: image.id,
      editUrl,
    });
    return { transformation, editUrl };
  } catch (err) {
    logger.error(`[transformImage] Error transformando imagen`, {
      userId,
      imageId: image?.id,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

module.exports = { uploadImage, transformImage };
