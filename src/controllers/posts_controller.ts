import postModel, { IPost } from "../models/posts_model";
import commentModel from "../models/comments_model";
import BaseController from "./base_controller";
import { Request, Response } from "express";
import userModel from "../models/user_model";

const postController = new BaseController<IPost>(postModel);

const createPost = async (body: IPost) => {
  try {
    const newPost = new postModel(body);
    await newPost.save();
    return true;
  } catch (err) {
    return false;
  }
};

const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await postModel.find();
    const postsWithImageUrl = await Promise.all(
      posts.map(async (post) => {
      const user = await userModel.findOne({ username: post.sender });
      const userId = user ? user._id : null;
      return {
        ...post.toObject(),
        userId: userId,
        // username: user ? user.username : null,
        imageUrl: post.imageUrl
      };
      })
    );

    res.status(200).json(postsWithImageUrl);
  } catch (err) {
    res.status(400).send(err.message);
  }
};



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

export {
  postController,
  deletePost,
  addLike,
  removeLike,
  isLiked,
  createPost,
  getAllPosts,
};
