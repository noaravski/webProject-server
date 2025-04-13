import express from "express";
import { uploadMiddleware } from "../middleware/uploadService";
import { authMiddleware } from "../controllers/user_controller";
import { createPost } from "../controllers/posts_controller";
import { uploadImage, uploadImageToPost } from "../controllers/file_controller";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: The Files API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     File:
 *       type: File
 */

/**
 * @swagger
 * /api/upload/:userId:
 *   post:
 *     summary: Adds a new profile picture
 *     description: Adds a new profile picture to a specific user
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/File'
 *     responses:
 *       200:
 *         description: The image was uploaded successfully
 *       400:
 *         description: The image was not able to be uploaded
 */
router.post(
  "/api/upload/:userId",
  authMiddleware,
  uploadMiddleware,
  (req, res) => {
    uploadImage(req, res);
  }
);

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Adds a new picture to a post
 *     description: Adds a new picture to a post on creation
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/File'
 *     responses:
 *       200:
 *         description: The image was uploaded successfully
 *       400:
 *         description: The image was not able to be uploaded
 *       500:
 *         description: error in the server side
 */
router.post("/api/post", authMiddleware, async (req, res) => {
  if (!req.file) {
    createPost(req, res);
    return;
  }
  uploadMiddleware(req, res, (err) => {
    if (err) {
      res.status(400).send({ error: "Error uploading file" });
      return;
    }
    uploadImageToPost(req, res);
  });
});

export default router;
