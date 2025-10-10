const sanitizeFilename = (name) =>
  name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-.]/g, "")
    .substring(0, 100)
    .toLowerCase();

module.exports = { sanitizeFilename };