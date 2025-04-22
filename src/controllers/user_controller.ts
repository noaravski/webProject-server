import userModel, { IUser } from "../models/user_model";
import BaseController from "./base_controller";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import commentModel from "../models/comments_model";
import postModel from "../models/posts_model";
import { updateUserDir } from "../middleware/fileService";
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
        profilePic: req.file?.filename ?? "noProfilePic.png",
      });

      const userId = user._id.toString();
      if (req.file) {
        if (req.file) {
          updateUserDir(userId, req.file);
        }
      }

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

const generateToken = (userId: string, username: string): tTokens | null => {
  console.log("refresh token expires in: ", process.env.REFRESH_TOKEN_EXPIRES);

  const random = Math.random().toString();

  if (!process.env.TOKEN_SECRET) {
    return null;
  }

  const accessToken = jwt.sign(
    {
      _id: userId,
      username: username,
      random: random,
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );

  const refreshToken = jwt.sign(
    {
      _id: userId,
      username: username,
      random: random,
    },
    process.env.TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
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
  const tokens = generateToken(userId.toString(), user.username);
  if (!tokens) {
    res.status(500).send("Server Error");
    return;
  }
  user.refreshToken?.push(tokens.refreshToken);
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
  username: string;
};

const logout = async (req: Request, res: Response) => {
  const refreshToken = req.headers.authorization?.split(" ")?.[1];
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
    async (
      err: jwt.VerifyErrors | null,
      data: jwt.JwtPayload | string | undefined
    ) => {
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
      const tokens = user.refreshToken?.filter((t) => t !== refreshToken);
      user.refreshToken = tokens;
      await user.save();
      res.status(200).send("logged out");
    }
  );
};

const refresh = async (req: Request, res: Response) => {
  const authHeaders = req.headers.authorization;
  const refreshToken = authHeaders && authHeaders.split(" ")[1];
  if (!refreshToken) {
    res.status(400).send("refresh token is required");
    return;
  }
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET as string,
    async (
      err: jwt.VerifyErrors | null,
      data: jwt.JwtPayload | string | undefined
    ) => {
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
      const newTokens = generateToken(user._id.toString(), user.username);
      //delete the old refresh token
      user.refreshToken = user.refreshToken.filter((t) => t !== refreshToken);

      //save the new refresh token in the user
      if (newTokens?.refreshToken) {
        user.refreshToken.push(newTokens.refreshToken);
      }
      await user.save();

      //return the new access token and the new refresh token
      res.status(200).send({
        accessToken: newTokens?.accessToken,
        refreshToken: newTokens?.refreshToken,
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

  jwt.verify(
    token,
    process.env.TOKEN_SECRET ||
      "c60fbfb2fccebe261f13eb76c752a5966596b2ff38bb6157f998e543fd5b42c99577a1c3449c58d6125fa5822b881968de9609ee983e5708d1dd267570fc5146",
    (err, payload) => {
      if (err) {
        res.status(401).send("Access Denied:" + err.message);
        return;
      }
      req.params.userId = (payload as TokenPayload)._id;
      req.params.username = (payload as TokenPayload).username;
      next();
    }
  );
};

const updateUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body;
  const userExists = await userModel.findOne({ _id: id });
  const usernameTaken = (
    await userModel.find({ username: body.username })
  ).filter((user) => user._id.toString() !== id);
  console.log(usernameTaken);
  if (body && userExists && usernameTaken.length == 0) {
    try {
      let item;
      if (req.file !== undefined) {
        item = await userModel.findByIdAndUpdate(
          id,
          { ...body, profilePic: req.file.filename },
          {
            new: true,
          }
        );
        await postModel.updateMany(
          { sender: userExists.username },
          { $set: { profilePic: req.file.filename, sender: item?.username } }
        );
        await commentModel.updateMany(
          { sender: userExists.username },
          { $set: { sender: item?.username } }
        );
      } else {
        item = await userModel.findByIdAndUpdate(
          id,
          { ...body },
          {
            new: true,
          }
        );
        await postModel.updateMany(
          { sender: userExists.username },
          { $set: { sender: item?.username } }
        );
        await commentModel.updateMany(
          { sender: userExists.username },
          { $set: { sender: item?.username } }
        );
      }

      if (item) {
        const userId = item._id.toString();
        if (req.file) {
          updateUserDir(userId, req.file);
        }

        item.refreshToken = [];
        const tokens = generateToken(item._id.toString(), item.username);
        if (tokens) {
          item.refreshToken.push(tokens.refreshToken);
          await item.save();
        }
        res.status(200).send(item);
      } else {
        res.status(404).send("Item not found");
      }
    } catch (err) {
      res
        .status(400)
        .send(err instanceof Error ? err.message : "An unknown error occurred");
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
    await commentModel.deleteMany({ sender: user?.username });
    await postModel.deleteMany({ sender: user?.username });
    if (user) {
      await user.deleteOne();
      res.status(200).send("User deleted");
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res
      .status(400)
      .send(err instanceof Error ? err.message : "An unknown error occurred");
  }
};

const client = new OAuth2Client();

const googleLogin = async (req: Request, res: Response) => {
  const credential = req.body.credential;
  if (!credential) {
    res.status(400).send("missing credential");
    return;
  }
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
        profilePic: payload?.picture,
        password: "google-signin",
      });
    }
    const tokens = generateToken(user._id.toString(), user.username);
    res.status(200).send(tokens);
    return;
  } catch (err) {
    res
      .status(400)
      .send(
        err instanceof Error ? err.message : "error missing email or password"
      );

    return;
  }
};

const getUserDetails = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findById(req.params.userId);

    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res
      .status(400)
      .send(err instanceof Error ? err.message : "An unknown error occurred");
  }
};

const getProfilePicUrl = async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const user = await userModel.findById(id);

    if (user) {
      res.status(200).send({ id: user._id, profilePic: user.profilePic });
    }
  } catch (err) {
    res
      .status(400)
      .send(err instanceof Error ? err.message : "An unknown error occurred");
  }
};

const getUserPosts = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findOne({ username: req.params.sender });
    if (!user) {
      res.status(404).send("User not found");
      return;
    }
    const posts = await postModel.find({ sender: user?.username });
    if (posts) {
      res.status(200).send(posts);
    } else {
      res.status(404).send("Posts not found");
    }
  } catch (err) {
    res
      .status(400)
      .send(err instanceof Error ? err.message : "An unknown error occurred");
  }
};

const getUserPostsW = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findOne({ _id: req.params.userId });
    if (!user) {
      res.status(404).send("User not found");
      return;
    }
    const posts = await postModel.find({ sender: user?.username });
    if (posts) {
      res.status(200).send(posts);
    } else {
      res.status(404).send("Posts not found");
    }
  } catch (err) {
    res
      .status(400)
      .send(err instanceof Error ? err.message : "An unknown error occurred");
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
  getProfilePicUrl,
  getUserPostsW,
};
