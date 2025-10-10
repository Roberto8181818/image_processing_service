const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand} = require("@aws-sdk/client-s3");
const fs = require("fs");
const R2 = require("../config/r2");
const logger = require("../utils/logger");

const BUCKET = process.env.R2_BUCKET_NAME;
const ACCOUNT = process.env.R2_ACCOUNT_ID;

const getPublicUrl = (key) => {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
};

const uploadBuffer = async (
  key,
  buffer,
  contentType = "application/octet-stream"
) => {
  try {
    logger.debug("[R2] Iniciando subida de buffer", { key, contentType });

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await R2.send(cmd);

    const url = getPublicUrl(key);
    logger.info("[R2] Buffer subido correctamente", { key, url });

    return url;
  } catch (error) {
    logger.error("[R2] Error subiendo buffer", { key, error: error.message });
    throw error;
  }
};

const uploadFile = async (
  key,
  filePath,
  contentType = "application/octet-stream"
) => {
  try {
    logger.debug("[R2] Iniciando subida de archivo", {
      key,
      filePath,
      contentType,
    });

    const stream = fs.createReadStream(filePath);
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: stream,
      ContentType: contentType,
    });

    await R2.send(cmd);
    const url = getPublicUrl(key);

    logger.info("[R2] Archivo subido correctamente", { key, filePath, url });
    return url;
  } catch (error) {
    logger.error("[R2] Error subiendo archivo", {
      key,
      filePath,
      error: error.message,
    });
    throw error;
  }
};

const getFileBuffer = async (key) => {
  try {
    logger.debug("[R2] Descargando objeto", { key });

    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await R2.send(cmd);

    const chunks = [];
    for await (const c of res.Body) chunks.push(c);
    const buffer = Buffer.concat(chunks);

    logger.info("[R2] Objeto descargado correctamente", {
      key,
      size: buffer.length,
    });
    return buffer;
  } catch (error) {
    logger.error("[R2] Error obteniendo objeto", { key, error: error.message });
    throw error;
  }
};

const deleteObject = async (key) => {
  try {
    logger.debug("[R2] Eliminando objeto", { key });

    const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    await R2.send(cmd);

    logger.info("[R2] Objeto eliminado correctamente", { key });
    return true;
  } catch (error) {
    logger.error("[R2] Error eliminando objeto", { key, error: error.message });
    throw error;
  }
};

module.exports = {
  uploadBuffer,
  uploadFile,
  getFileBuffer,
  deleteObject,
  getPublicUrl,
};
