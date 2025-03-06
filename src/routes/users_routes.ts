import express, { Request, Response } from "express";
import {
  usersController,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
  refresh,
  googleLogin,
  getUserDetails,
  authMiddleware,
  getUserPosts,
  idBySender,
  getProfilePicUrl,
} from "../controllers/user_controller";
import { uploadMiddleware } from "../middleware/uploadService";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: The Authentication API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - username
 *       properties:
 *         email:
 *           type: string
 *           description: The user email
 *         username:
 *           type: string
 *           description: The user username
 *         password:
 *           type: string
 *           description: The user password
 *
 *       example:
 *         email: 'bob@gmail.com'
 *         username: 'bob'
 *         password: '123456'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUser:
 *       type: object
 *       required:
 *         - email
 *         - description
 *         - username
 *       properties:
 *         email:
 *           type: string
 *           description: The user email
 *         username:
 *           type: string
 *           description: The user username
 *         description:
 *           type: string
 *           description: The user description
 *
 *       example:
 *         email: 'bob@gmail.com'
 *         username: 'bob'
 *         description: 'Here you can write about yourself, your favorite movies...'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password
 *
 *       example:
 *         email: 'bob@gmail.com'
 *         password: '123456'
 */

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return tokens
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'

 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token
 *                   example: hghkgkgkufkydtsrsrdklojojoppjgeww...
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                   example: hghkgkgkufkydtsrsrdklojojoppjgeww...
 *                 _id:
 *                   type: string
 *                   description: User ID    
 *                   example: 60d0fe4f5311236168a109ca
 *       400:
 *         description: Invalid credentials or request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/login", login);

router.post("/login/google", googleLogin);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate the refresh token
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: hghkgkgkufkydtsrsrdklojojoppjgeww...
 *     responses:
 *       200:
 *         description: Successful logout
 *       400:
 *         description: missing refresh token
 *       403:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post("/logout", logout);

/**
 * @swagger
 * /user/refresh:
 *   post:
 *     summary: Refresh tokens
 *     description: Refresh access and refresh tokens using the provided refresh token
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: hghkgkgkufkydtsrsrdklojojoppjgeww...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: hghkgkgkufkydtsrsrdklojojoppjgeww...
 *                 refreshToken:
 *                   type: string
 *                   example: hghkgkgkufkydtsrsrdklojojoppjgeww...
 *       400:
 *         description: Invalid refresh token
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Retrieve a list of all users
 *     description: Retrieve a list of all users
 *     tags: [User]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get("/", (req: Request, res: Response) => {
  usersController.getAllItems(req, res);
});

/**
 * @swagger
 * /user/:
 *   post:
 *     summary: registers a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: The new user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User already exists or missing fields!
 *       500:
 *         description: Server error
 */
router.post("/", uploadMiddleware, async (req: Request, res: Response) => {
  createUser(req, res);
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve a single user by ID
 *     description: Retrieve a single user by its ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A single user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User not found or invalid ID supplied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/", (req: Request, res: Response) => {
  usersController.getItemById(req, res);
});

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     description: Update a single user by its ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUser'
 *     responses:
 *       200:
 *         description: The updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateUser'
 *       400:
 *         description: User not found or invalid ID supplied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/:id", (req: Request, res: Response) => {
  updateUser(req, res);
});

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Delete a single user by its ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: User not found or invalid ID supplied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", (req: Request, res: Response) => {
  deleteUser(req, res);
});

router.get("/details", authMiddleware, (req: Request, res: Response) => {
  getUserDetails(req, res);
});

router.get("/profilePic/:id", (req: Request, res: Response) => {
  getProfilePicUrl(req, res);
});

router.get("/posts", authMiddleware, (req: Request, res: Response) => {
  getUserPosts(req, res);
});

export default router;
