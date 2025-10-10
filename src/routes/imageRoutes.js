const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const imageController = require("../controllers/imageController");
const imageProcessingService = require("../services/imageProcessingService");
const { transformValidation } = require("../validators/imageValidator");
const checkImageOwner = require("../middlewares/checkImageOwner");

/**
 * @swagger
 * tags:
 *   name: Image
 *   description: Endpoints para gestionar imágenes del usuario
 */

/**
 * @swagger
 * /image:
 *   get:
 *     summary: Lista todas las imágenes del usuario autenticado
 *     description: Devuelve todas las imágenes subidas por el usuario. Si se pasa `?includeTransformations=true`, cada imagen incluirá sus transformaciones asociadas.
 *     tags: [Image]
 *     parameters:
 *       - in: query
 *         name: includeTransformations
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Si es true, incluye las transformaciones asociadas a cada imagen
 *     responses:
 *       200:
 *         description: Lista de imágenes del usuario
 *         content:
 *           application/json:
 *             examples:
 *               SinTransformaciones:
 *                 summary: Lista básica de imágenes
 *                 value:
 *                   success: true
 *                   data:
 *                     - image_id: 1
 *                       filename: "historia_db.png_1759857702158.png"
 *                       url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/historia_db.png_1759857702158.png"
 *                       metadata:
 *                         size: 2910426
 *                         mimetype: "image/png"
 *                         uploadedAt: "2025-10-07T17:21:44.233Z"
 *                         originalname: "historia_db.png"
 *                     - image_id: 2
 *                       filename: "foto_perro.png_1759857702158.png"
 *                       url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/foto_perro.png_1759857702158.png"
 *                       metadata:
 *                         size: 1550426
 *                         mimetype: "image/png"
 *                         uploadedAt: "2025-10-07T17:25:20.233Z"
 *                         originalname: "foto_perro.png"
 *               ConTransformaciones:
 *                 summary: Lista de imágenes con transformaciones incluidas
 *                 value:
 *                   success: true
 *                   data:
 *                     - image_id: 1
 *                       filename: "historia_db.png_1759857702158.png"
 *                       url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/historia_db.png_1759857702158.png"
 *                       metadata:
 *                         size: 2910426
 *                         mimetype: "image/png"
 *                         uploadedAt: "2025-10-07T17:21:44.233Z"
 *                         originalname: "historia_db.png"
 *                       transformations:
 *                         - transformation_id: 1
 *                           filename: "edit_2025-10-07T17-24-42-413Z.avif"
 *                           url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/edits/historia_db.png_1759857702158/edit_2025-10-07T17-24-42-413Z.avif"
 *                     - image_id: 2
 *                       filename: "foto_perro.png_1759857702158.png"
 *                       url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/foto_perro.png_1759857702158.png"
 *                       metadata:
 *                         size: 1550426
 *                         mimetype: "image/png"
 *                         uploadedAt: "2025-10-07T17:25:20.233Z"
 *                         originalname: "foto_perro.png"
 *                       transformations:
 *                         - transformation_id: 5
 *                           filename: "edit_2025-10-07T17-31-15-716Z.webp"
 *                           url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/edits/foto_perro.png_1759857702158/edit_2025-10-07T17-31-15-716Z.webp"
 */
router.get("/", imageController.list);

/**
 * @swagger
 * /image/{id}:
 *   get:
 *     summary: Obtiene una imagen específica
 *     description: Devuelve la información de una imagen. Si se pasa `?includeTransformations=true`, incluirá las transformaciones asociadas.
 *     tags: [Image]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la imagen
 *       - in: query
 *         name: includeTransformations
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Si es true, incluye las transformaciones asociadas
 *     responses:
 *       200:
 *         description: Detalle de la imagen
 *         content:
 *           application/json:
 *             examples:
 *               SinTransformaciones:
 *                 summary: Imagen sin transformaciones
 *                 value:
 *                   success: true
 *                   data:
 *                     image_id: 1
 *                     filename: "historia_db.png_1759857702158.png"
 *                     url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/historia_db.png_1759857702158.png"
 *                     metadata:
 *                       size: 2910426
 *                       mimetype: "image/png"
 *                       uploadedAt: "2025-10-07T17:21:44.233Z"
 *                       originalname: "historia_db.png"
 *               ConTransformaciones:
 *                 summary: Imagen con transformaciones incluidas
 *                 value:
 *                   success: true
 *                   data:
 *                     image_id: 1
 *                     filename: "historia_db.png_1759857702158.png"
 *                     url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/historia_db.png_1759857702158.png"
 *                     metadata:
 *                       size: 2910426
 *                       mimetype: "image/png"
 *                       uploadedAt: "2025-10-07T17:21:44.233Z"
 *                       originalname: "historia_db.png"
 *                     transformations:
 *                       - transformation_id: 1
 *                         filename: "edit_2025-10-07T17-24-42-413Z.avif"
 *                         url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/edits/historia_db.png_1759857702158/edit_2025-10-07T17-24-42-413Z.avif"
 *                       - transformation_id: 2
 *                         filename: "edit_2025-10-07T17-31-15-716Z.avif"
 *                         url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/edits/historia_db.png_1759857702158/edit_2025-10-07T17-31-15-716Z.avif"
 *       404:
 *         description: Imagen no encontrada
 */
router.get("/:id", imageController.getOne);

/**
 * @swagger
 * /image:
 *   post:
 *     summary: Sube una imagen y genera su thumbnail
 *     description: Permite al usuario autenticado subir una imagen. El sistema guarda la imagen original, genera un thumbnail automáticamente y devuelve las URLs de ambos archivos.
 *     tags: [Image]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir
 *     responses:
 *       201:
 *         description: Imagen subida correctamente y thumbnail generado
 *         content:
 *           application/json:
 *             examples:
 *               EjemploExitoso:
 *                 summary: Respuesta exitosa
 *                 value:
 *                   message: "Imagen original subida y thumbnail creado"
 *                   image:
 *                     id: 3
 *                     user_id: 1
 *                     filename: "historia_db.png_1759878941584.png"
 *                     path: "user_1/originals/historia_db.png_1759878941584.png"
 *                     url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/historia_db.png_1759878941584.png"
 *                     metadata:
 *                       size: 2910426
 *                       mimetype: "image/png"
 *                       uploadedAt: "2025-10-07T23:15:44.481Z"
 *                       originalname: "historia_db.png"
 *                     updatedAt: "2025-10-07T23:15:44.484Z"
 *                     createdAt: "2025-10-07T23:15:44.484Z"
 *                   thumbnail:
 *                     filename: "historia_db.png_thumb_1759878941584.jpg"
 *                     url: "https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/thumbnails/historia_db.png_thumb_1759878941584.jpg"
 *       400:
 *         description: No se envió ninguna imagen o el formato es inválido
 *       401:
 *         description: No autorizado (token faltante o inválido)
 */
router.post("/", upload.single("image"), imageController.upload);

/**
 * @swagger
 * /image/transform:
 *   post:
 *     summary: Aplica una transformación a una imagen existente
 *     description: Permite aplicar transformaciones como filtros, formatos o espejado a una imagen ya subida. Devuelve los metadatos de la transformación y la URL del archivo resultante.
 *     tags:
 *       - Image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID de la imagen original que se transformará.
 *               filter:
 *                 type: string
 *                 enum: [greyscale, sepia, blur, sharpen, none]
 *                 example: greyscale
 *                 description: Filtro visual que se aplicará a la imagen.
 *               format:
 *                 type: string
 *                 enum: [jpeg, png, webp, avif]
 *                 example: avif
 *                 description: Formato de salida de la imagen transformada.
 *               mirror:
 *                 type: boolean
 *                 example: true
 *                 description: Si se establece en true, aplica un efecto espejo horizontal.
 *     responses:
 *       200:
 *         description: Transformación aplicada con éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Transformación aplicada con éxito
 *                 transformation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     image_id:
 *                       type: integer
 *                       example: 1
 *                     filename:
 *                       type: string
 *                       example: edit_2025-10-07T23-16-36-467Z.avif
 *                     path:
 *                       type: string
 *                       example: user_1/edits/historia_db.png_1759857702158/edit_2025-10-07T23-16-36-467Z.avif
 *                     url:
 *                       type: string
 *                       example: https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/edits/historia_db.png_1759857702158/edit_2025-10-07T23-16-36-467Z.avif
 *                     params:
 *                       type: object
 *                       properties:
 *                         filter:
 *                           type: string
 *                           example: greyscale
 *                         format:
 *                           type: string
 *                           example: avif
 *                         mirror:
 *                           type: boolean
 *                           example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-10-07T23:16:37.092Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-10-07T23:16:37.092Z
 *                 url:
 *                   type: string
 *                   example: https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/edits/historia_db.png_1759857702158/edit_2025-10-07T23-16-36-467Z.avif
 *       400:
 *         description: Parámetros inválidos o imagen no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error al aplicar la transformación
 */
router.post(
  "/:id/transform",
  transformValidation,
  checkImageOwner,
  imageController.transform
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 4214
 *         user_id:
 *           type: integer
 *           example: 6114
 *         filename:
 *           type: string
 *           example: foto1.png
 *         path:
 *           type: string
 *           example: uploads/6529dba423a15a001fb2c51a/foto1.png
 *         url:
 *           type: string
 *           example: https://pub-e24908244420489f9b1278a2e9957147.r2.dev/user_1/originals/historia_db.png_1759857702158.png
 *         metadata:
 *           type: object
 *           properties:
 *             size:
 *               type: integer
 *               example: 2910426
 *             mimetype:
 *               type: string
 *               example: image/png
 *             uploadedAt:
 *               type: string
 *               format: date-time
 *               example: 2025-10-07T17:21:44.233Z
 *             originalname:
 *               type: string
 *               example: foto_perro.png
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-07T17:21:44.484Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-07T17:21:44.484Z
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: Representa un usuario registrado en el sistema.
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: roberto
 *         password:
 *           type: string
 *           description: >
 *             Contraseña del usuario almacenada de forma cifrada (hash con bcrypt).
 *           example: $2b$10$9sF3vV4h1f8JvQYz1mKJtO5GzLJ2IuO.ZE2t9yY3BFGHYbzE8jK2y
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-07T17:21:44.484Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-07T17:21:44.484Z
 */

module.exports = router;
