const express = require("express");
const app = express();
const authRoutes = require("./routes/authRoutes");
const imageRoutes = require("./routes/imageRoutes");
const authMiddleware = require("./middlewares/auth");
const morgan = require("morgan");
const logger = require("./utils/logger");
const { globalLimiter, loginLimiter } = require("./middlewares/limiter");
const swaggerDocs = require("./config/swagger");

app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const stream = {
  write: (message) => logger.http(message.trim()),
};

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream,
  })
);

app.use("/auth", loginLimiter, authRoutes);

app.use("/uploads", express.static("uploads"));

app.use("/image", authMiddleware, imageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API OK" });
});

swaggerDocs(app);

module.exports = app;
