import userModel, { IUser } from "../models/user_model";
import BaseController from "./base_controller";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
      res.status(400).send(error);
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
  const username = req.body.username;
  if (!email || !password || !username) {
    res.status(400).send("Email, username and password are required");
    return;
  }
  const user = await userModel.findOne({ email: email, username: username });
  if (!user) {
    res.status(400).send("Email, username and password are required");
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
        res.status(403).send("invalid token");
        return;
      }
      const payload = data as TokenPayload;
      const user = await userModel.findOne({ _id: payload._id });
      if (!user) {
        res.status(404).send("invalid token");
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
  //first validate the refresh token
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
        res.status(500).send("Internal server error");
        return;
      }
      //find the user
      const payload = data as TokenPayload;
      const user = await userModel.findOne({ _id: payload._id });
      if (!user) {
        res.status(404).send("invalid token");
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
  const usernameTaken = await userModel.find({ username: body.username });
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
    res.status(400).send("Username or email is taken or user to update doesnt exists!");
  }
};

const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const user = await userModel.findById(id);
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

export {
  usersController,
  createUser,
  updateUser,
  deleteUser,
  login,
  logout,
  refresh,
};
