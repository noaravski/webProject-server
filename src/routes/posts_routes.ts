import express, { Request, Response } from "express";
import {
  postController,
  deletePost,
  addLike,
  removeLike,
  isLiked,
  createPost,
  getAllPosts,
} from "../controllers/posts_controller";
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
 *         - content
 *         - sender
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the post
 *         content:
 *           type: string
 *           description: The content of the post
 *         sender:
 *           type: string
 *           description: The sender of the post
 *       example:
 *         _id: 245234t234234r234r23f4
 *         content: This is the content of my first post.
 *         sender: noa
 *         likes: [245234t234234r234r23f4]
 */


router.post("/", authMiddleware,(req: Request, res: Response) => {
  createPost(req,res);
});

/**
 * @swagger
 * /posts:
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
router.get("/posts", (req: Request, res: Response) => {
  getAllPosts(req, res);
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

/**
 * @swagger
 * /post/like/{id}:
 *   put:
 *     summary: add a like to a post
 *     description: add a like to a post by its ID
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
 *         description: The like was added successfully
 *       400:
 *         description: The like was not added
 */
router.put("/post/like/:id", authMiddleware, (req: Request, res: Response) => {
  addLike(req, res);
});

/**
 * @swagger
 * /post/unlike/{id}:
 *   put:
 *     summary: remove a like from a post
 *     description: remove a like from a post by its ID
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
 *         description: The like was removed successfully
 *       400:
 *         description: The like was not removed
 */
router.put(
  "/post/unlike/:id",
  authMiddleware,
  (req: Request, res: Response) => {
    removeLike(req, res);
  }
);

router.get(
  "/post/isliked/:id",
  authMiddleware,
  (req: Request, res: Response) => {
    isLiked(req, res);
  }
);

export default router;
