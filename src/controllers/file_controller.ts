import { Request, Response } from "express";
import { createPost } from "./posts_controller";
import userModel from "../models/user_model";
import postModel from "../models/posts_model";

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
      await createPost({
        ...req.body,
        sender: user?.username,
        userId: user?._id,
        profilePic: user?.profilePic,
        imageUrl: req.file.filename,
      });
      res.status(200).send("File uploaded successfully - " + req.file.filename);
    } else {
      res.status(400).send("No file uploaded.");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Internal server error");
  }
};

const updateImageToPost = async (req: Request, res: Response) => {
  try {
    if (req.file) {
      const post = await postModel.findOneAndUpdate(
        { _id: req.params.postId },
        {
          content: req.body.content,
          imageUrl: req.file.filename,
        },
        { new: true }
      );

      if (!post) {
        res.status(404).send("Post not found or user not authorized.");
        return;
      }
      res.status(200).send("File uploaded successfully - " + req.file.filename);
    } else {
      res.status(400).send("No file uploaded.");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Internal server error");
  }
};

export { uploadImage, uploadImageToPost, updateImageToPost };
