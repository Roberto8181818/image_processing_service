const { body } = require('express-validator');

exports.transformValidation = [
  body('resize').optional().isObject(),
  body('resize.width').optional().isInt({ min: 1 }),
  body('resize.height').optional().isInt({ min: 1 }),

  body('crop').optional().isObject(),
  body('crop.left').optional().isInt({ min: 0 }),
  body('crop.top').optional().isInt({ min: 0 }),
  body('crop.width').optional().isInt({ min: 1 }),
  body('crop.height').optional().isInt({ min: 1 }),

  body('rotate').optional().isInt(),
  body('watermark').optional().isString(),
  body('format').optional().isIn(['jpeg', 'png', 'webp', 'avif'])
];
