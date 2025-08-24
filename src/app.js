require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');
const authMiddleware = require('./middlewares/auth')

app.use(express.json());

app.use('/auth', authRoutes);

app.use("/uploads", express.static("uploads"));

app.use('/image', authMiddleware, imageRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'API OK' });
});

module.exports = app;
