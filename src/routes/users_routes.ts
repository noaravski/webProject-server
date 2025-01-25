import express, { Request, Response } from "express";
import {
  usersController,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
  refresh,
} from "../controllers/user_controller";


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
 *             $ref: '#/components/schemas/User'
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
 *       500:
 *         description: Server error
 */
router.post("/login", login);

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
 *       500:
 *         description: Server error
 */
router.post("/refresh", refresh);

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
*       200:
*         description: The new user
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/User'
*/
router.post("/", (req: Request, res: Response) => {
  createUser(req, res);
});

router.get("/:id", (req: Request, res: Response) => {
  usersController.getItemById(req, res);
});

router.put("/:id", (req: Request, res: Response) => {
  updateUser(req, res);
});

router.delete("/:id", (req: Request, res: Response) => {
  deleteUser(req, res);
});

export default router;
