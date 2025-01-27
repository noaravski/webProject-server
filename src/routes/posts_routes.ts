import express, { Request, Response } from "express";
import { postController, deletePost } from "../controllers/posts_controller";
import { authMiddleware } from "../controllers/user_controller";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: The Posts API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - sender
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the post
 *         title:
 *           type: string
 *           description: The title of the post
 *         content:
 *           type: string
 *           description: The content of the post
 *         sender:
 *           type: string
 *           description: The sender of the post
 *       example:
 *         _id: 245234t234234r234r23f4
 *         title: My First Post
 *         content: This is the content of my first post.
 *         sender: noa
 */


/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns the list of all the posts
 *     description: Retrieve a list of all posts
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: The list of the posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get("/", (req: Request, res: Response) => {
  postController.getAllItems(req, res);
});

/**
 * @swagger
 * /:
 *   post:
 *     summary: Creates a new post
 *     description: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  postController.createItem(req, res);
});

/**
 * @swagger
 * /post/{id}:
 *   delete:
 *     summary: Deletes a post by id
 *     description: Delete a single post by its ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post id
 *     responses:
 *       200:
 *         description: The post was successfully deleted
 *       400:
 *         description: error
 *       404:
 *         description: The post was not found
 */
router.delete("/post/:id", authMiddleware, (req: Request, res: Response) => {
  deletePost(req, res);
});

/**
 * @swagger
 * /post/{id}:
 *   get:
 *     summary: Gets a post by ID
 *     description: Get a single post by its ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post ID
 *     responses:
 *       200:
 *         description: The post description by ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: The id not exists
 *       404:
 *         description: The post was not found
 *       500:
 *         description: Server error
 */
router.get("/post/:id", (req: Request, res: Response) => {
  postController.getItemById(req, res);
});

/**
 * @swagger
 * /post:
 *   get:
 *     summary: Get posts by sender
 *     description: Get post by sender
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         required: true
 *         description: The sender of the posts
 *     responses:
 *       200:
 *         description:  A single post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         description: The sender was not found
 *       404:
 *         description: The sender was not found
 *       500:
 *         description: Server error
 */
router.get("/post", (req: Request, res: Response) => {
  postController.getItemBySender(req, res);
});

/**
 * @swagger
 * /post/{id}:
 *   put:
 *     summary: Updates a post by id
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The post id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: The post was successfully updated
 *       400:
 *         description: The post was not found
 */
router.put("/post/:id", authMiddleware, (req: Request, res: Response) => {
  postController.updateItem(req, res);
});

export default router;
