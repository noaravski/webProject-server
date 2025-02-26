import userModel, { IUser } from "../models/user_model";
import BaseController from "./base_controller";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import commentModel from "../models/comments_model";
import postModel from "../models/posts_model";

const usersController = new BaseController<IUser>(userModel);

const createUser = async (req: Request, res: Response) => {
  const body = req.body;
  const userExists = await userModel.find({ username: body.username });
  if (body && userExists.length == 0) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.password, salt);
      const user = await userModel.create({
        username: body.username,
        email: body.email,
        password: hashedPassword,
      });
      res.status(201).send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  } else {
    res.status(400).send("User already exists or missing fields!");
  }
};

type tTokens = {
  accessToken: string;
  refreshToken: string;
};

const generateToken = (userId: string): tTokens | null => {
  console.log("refresh token expires in: ", process.env.REFRESH_TOKEN_EXPIRES);

  const random = Math.random().toString();

  if (!process.env.TOKEN_SECRET) {
    return null;
  }

  const accessToken = jwt.sign(
    {
      _id: userId,
      random: random,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRES }
  );

  const refreshToken = jwt.sign(
    {
      _id: userId,
      random: random,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
  );
  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const login = async (req: Request, res: Response) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email, username and password are required");
    return;
  }
  const user = await userModel.findOne({ email: email });
  if (!user) {
    res.status(404).send("User not found");
    return;
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400).send("Password is incorrect");
    return;
  }
  const userId: string = user._id.toString();
  const tokens = generateToken(userId);
  if (!tokens) {
    res.status(500).send("Server Error");
    return;
  }
  user.refreshToken.push(tokens.refreshToken);
  await user.save();
  res.status(200).send({
    email: user.email,
    username: user.username,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    _id: user._id,
  });
};

type TokenPayload = {
  _id: string;
};

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    res.status(400).send("refresh token is required");
    return;
  }
  if (!process.env.TOKEN_SECRET) {
    res.status(500).send("missing auth configuration");
    return;
  }
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: any, data: any) => {
      if (err) {
        res.status(500).send("internal error");
        return;
      }
      const payload = data as TokenPayload;
      const user = await userModel.findOne({ _id: payload._id });
      if (!user) {
        res.status(403).send("invalid token");
        return;
      }
      const tokens = user.refreshToken.filter((t) => t !== refreshToken);
      user.refreshToken = tokens;
      await user.save();
      res.status(200).send("logged out");
    }
  );
};

const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    res.status(400).send("refresh token is required");
    return;
  }
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: any, data: any) => {
      if (err) {
        res.status(400).send("Invalid Refresh Token");
        return;
      }
      //find the user
      const payload = data as TokenPayload;
      const user = await userModel.findOne({ _id: payload._id });
      if (!user) {
        res.status(400).send("invalid token");
        return;
      }
      //check that the token exists in the user
      if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
        user.refreshToken = [];
        await user.save();
        res.status(400).send("invalid token");
        return;
      }
      //generate a new access token
      const newTokens = generateToken(user._id.toString());
      //delete the old refresh token
      user.refreshToken = user.refreshToken.filter((t) => t !== refreshToken);

      //save the new refresh token in the user
      user.refreshToken.push(newTokens.refreshToken);
      await user.save();

      //return the new access token and the new refresh token
      res.status(200).send({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
    }
  );
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("authorization");
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    res.status(401).send("Access Denied");
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) {
      res.status(401).send("Access Denied");
      return;
    }
    req.params.userId = (payload as TokenPayload)._id;
    next();
  });
};

const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body;
  const userExists = await userModel.find({ _id: id });
  const usernameTaken = (
    await userModel.find({ username: body.username })
  ).filter((user) => user._id.toString() !== id);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    res.status(400).send("Invalid email format");
    return;
  }

  if (body && userExists.length == 1 && usernameTaken.length == 0) {
    try {
      const item = await userModel.findByIdAndUpdate(id, body, {
        new: true,
      });
      if (item) {
        res.status(200).send(item);
      } else {
        res.status(404).send("Item not found");
      }
    } catch (error) {
      res.status(400).send(error.message);
    }
  } else {
    res
      .status(400)
      .send("Username or email is taken or user to update doesnt exists!");
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const user = await userModel.findById(id);
    await commentModel.deleteMany({ sender: user.username });
    await postModel.deleteMany({ sender: user.username });
    if (user) {
      await user.deleteOne();
      res.status(200).send("User deleted");
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const client = new OAuth2Client();

const googleLogin = async (req: Request, res: Response) => {
  const credential = req.body.credential;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    let user = await userModel.findOne({ email: email });
    if (user == null) {
      user = await userModel.create({
        email: email,
        username: payload?.name,
        // imageUrl: payload?.picture,
        password: "google-signin",
      });
    }
    const tokens = generateToken(user._id);
    res.status(200).send(tokens);
    return;
  } catch (err) {
    res.status(400).send("error missing email or password");
    return;
  }
};

const getUserDetails = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findById(req.params.userId);

    if (user) {
      const userDetails = {
        username: user.username,
        email: user.email,
        description: user.description,
      };
      res.status(200).send(userDetails);
    } else {
      res.status(404).send("User details was not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const getUserPosts = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findById(req.params.userId);
    const posts = await postModel.find({ sender: user?.username });
    if (posts) {
      res.status(200).send(posts);
    } else {
      res.status(404).send("Posts not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

export {
  usersController,
  getUserPosts,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
  refresh,
  googleLogin,
  getUserDetails,
};
