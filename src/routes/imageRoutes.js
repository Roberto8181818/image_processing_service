const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const imageController = require("../controllers/imageController");
const { transformValidation } = require('../validators/imageValidator');
const checkImageOwner = require("../middlewares/checkImageOwner");


router.get('/', imageController.list);

router.get('/:id', imageController.getOne);

router.post('/', upload.single("image"), imageController.upload);

router.post('/:id/transform', transformValidation, checkImageOwner, imageController.transform);


module.exports = router;