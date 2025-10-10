const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");

const logDir = path.join(__dirname, "../../logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const customLevels = {
  levels: {
    http: 0,
    error: 1,
    warn: 2,
    info: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    verbose: "cyan",
    debug: "blue",
    silly: "gray",
  },
};

const logger = createLogger({
  levels: customLevels.levels,
  level: "silly",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "image-processing-service" },
  transports: [
    new transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),

    new transports.File({
      filename: path.join(logDir, "combined.log"),
      level: "info",
    }),

    new transports.File({
      filename: path.join(logDir, "http.log"),
      level: "http",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  const { combine, colorize, printf } = format;
  logger.add(
    new transports.Console({
      level: "silly",
      format: combine(
        colorize({ all: true }),
        printf(({ level, message, timestamp }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    })
  );
}

module.exports = logger;
