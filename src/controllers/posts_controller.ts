import postModel, { IPost } from "../models/posts_model";
import commentModel from "../models/comments_model";
import BaseController from "./base_controller";
import { Request, Response } from "express";
import { downloadBase64Image, generateDescForPostWithAi, generatePostWithAi, subjectsForPost } from "../services/aiService";

const postController = new BaseController<IPost>(postModel);

// Delete post and all comments associated with it
const deletePost = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const post = await postModel.findById(id);
    if (post) {
      await commentModel.deleteMany({ sender: post.sender });
      await post.deleteOne();
      res.status(200).send("Post deleted");
    } else {
      res.status(404).send("Post was not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const addLike = async (req: Request, res: Response) => {
  const postId = req.params.id;

  try {
    const post = await postModel.findById(postId);
    if (post) {
      post.likes.push(req.params.userId);
      await post.save();
      res.status(200).send("Like added");
    } else {
      res.status(404).send("Post was not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const removeLike = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const post = await postModel.findById(id);
    if (post) {
      post.likes = post.likes.filter((like) => like != req.params.userId);
      await post.save();
      res.status(200).send("Like Removed");
    } else {
      res.status(404).send("Post was not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const isLiked = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const post = await postModel.findById(id);
    if (post) {
      const isLikedByUser = post.likes.includes(req.params.userId);
      res.status(200).json({ isLiked: isLikedByUser });
      return;
    } else {
      res.status(404).send("Post was not found");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
};

const createPostGeneratedByAI = async () => {
  const randomIndex = Math.floor(Math.random() * subjectsForPost.length);
  const postSubject: string = subjectsForPost[randomIndex];
  const descForPost = await generateDescForPostWithAi(postSubject);
  const imagePost = await generatePostWithAi(descForPost);
  const postDate = new Date().getTime();
  const fileName = `${postSubject}_${postDate}.png`;
  downloadBase64Image(imagePost, fileName);

  return postModel.create({ content: descForPost, sender: "AI", image: fileName, createdAt: new Date(postDate) });
}

export { postController, deletePost, addLike, removeLike, isLiked, createPostGeneratedByAI };


