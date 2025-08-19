require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');
const authMiddleware = require('./middlewares/auth')

app.use(express.json());

app.use('/auth', authRoutes);

app.use('/images', imageRoutes);

app.use("/uploads", express.static("uploads"));

app.get('/', (req, res) => {
  res.json({ message: 'API OK' });
});

module.exports = app;
