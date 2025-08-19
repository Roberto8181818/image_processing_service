const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const imageController = require("../controllers/imageController");

router.post('/image', upload.single("image"), imageController.upload);

module.exports = router;