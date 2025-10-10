const { IMAGE_CONFIG } = require("../config/constants");
const logger = require("../utils/logger");

function validateImage(file) {
  if (!file || !file.buffer) {
    logger.warn("Intento de subida sin archivo recibido");
    return "No se recibió ninguna imagen.";
  }

  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    logger.warn("Intento de subir archivo que excede el tamaño permitido");
    return `El archivo excede el tamaño máximo permitido (${
      IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
    } MB).`;
  }

  const mime = file.mimetype.split("/")[1].toLowerCase();
  if (!IMAGE_CONFIG.SUPPORTED_FORMATS.includes(mime)) {
    logger.warn("Intento de subir archivo con formato no soportado");
    return `Formato no soportado. Solo se permiten: ${IMAGE_CONFIG.SUPPORTED_FORMATS.join(
      ", "
    )}.`;
  }

  return null;
}

module.exports = { validateImage };
