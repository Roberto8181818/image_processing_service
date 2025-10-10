const IMAGE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  THUMBNAIL_SIZE: { width: 200 },
  SUPPORTED_FORMATS: ["jpeg", "jpg", "png", "gif"],
  SUPPORTED_OUTPUT_FORMATS: ["jpeg", "png", "webp", "avif"],
};

module.exports = {
  IMAGE_CONFIG,
};
