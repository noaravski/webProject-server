import { Request, Response } from "express";
import { createPost } from "./posts_controller";
import userModel from "../models/user_model";

const uploadImage = async (req: Request, res: Response) => {
  if (req.file) {
    res.status(200).send("File uploaded successfully - " + req.file.filename);
  } else {
    res.status(400).send("No file uploaded.");
  }
};

const uploadImageToPost = async (req: Request, res: Response) => {
  try {
    if (req.file) {
      const user = await userModel.findOne({ _id: req.params.userId });
      req.body = {
        ...req.body,
        sender: user.username,
        userId: user._id,
        profilePic: user.profilePic,
        imageUrl: req.file.filename,
      };
      await createPost(req, res);
      res.status(200).send("File uploaded successfully - " + req.file.filename);
    } else {
      res.status(400).send("No file uploaded.");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Internal server error");
  }
};

export { uploadImage, uploadImageToPost };
