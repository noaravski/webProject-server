import express, { Request, Response } from "express";
import {
  getCommentsByPostId,
  commentsController,
} from "../controllers/comments_controller";
import { authMiddleware } from "../controllers/user_controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - content
 *         - postId
 *         - sender
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the comment
 *         content:
 *           type: string
 *           description: The content of the comment
 *         postId:
 *           type: string
 *           description: The id of the post the comment belongs to
 *         sender:
 *           type: string
 *           description: The sender of the comment
 */

/**
 * @swagger
 * /add-comment:
 *   post:
 *     summary: Adds a new comment
 *     description: Adds a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: The comment was successfully created
 *       400:
 *         description: Bad request
 */
router.post("/add-comment", authMiddleware, (req: Request, res: Response) => {
  commentsController.createItem(req, res);
});

/**
 * @swagger
 * /comment/{id}:
 *   get:
 *     summary: Gets a comment by id
 *     description: Get a single comment by its ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     responses:
 *       200:
 *         description: The comment description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: The comment was not found
 */
router.get("/comment/:id", (req: Request, res: Response) => {
  commentsController.getItemById(req, res);
});

/**
 * @swagger
 * /comment/{id}:
 *   put:
 *     summary: Updates a comment by id
 *     description: Update a single comment by its ID
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: The comment was successfully updated
 *       404:
 *         description: The comment was not found
 */
router.put("/comment/:id", authMiddleware, (req: Request, res: Response) => {
  commentsController.updateItem(req, res);
});

/**
 * @swagger
 * /comment/{id}:
 *   delete:
 *     summary: Deletes a comment by id
 *     description: Delete a single comment by its ID
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The comment id
 *     responses:
 *       200:
 *         description: The comment was successfully deleted
 *       404:
 *         description: The comment was not found
 */
router.delete("/comment/:id", authMiddleware, (req: Request, res: Response) => {
  commentsController.deleteItem(req, res);
});

/**
 * @swagger
 * /comments/{post_id}:
 *   get:
 *     summary: Gets comments by post id
 *     description: Get a list of comments by post id
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: post_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post id
 *     responses:
 *       200:
 *         description: The list of comments for the post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       404:
 *         description: The post was not found
 */
router.get("/comments/:post_id", (req: Request, res: Response) => {
  getCommentsByPostId(req, res);
});

export default router;
