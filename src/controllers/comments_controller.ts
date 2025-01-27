import commentsModel, { IComments } from "../models/comments_model";
import BaseController from "./base_controller";
import { Request, Response } from "express";
import Comment from "../models/comments_model";
import Posts from "../models/posts_model";

const getCommentsByPostId = async (req: Request, res: Response) => {
  const postId = req.params.post_id;
  try {
    const post = await Posts.findById(postId);
    if (!post) {
      res.status(404).send("Invalid post id");
    } else {
      const comments = await Comment.find({ postId: postId });
      if (comments) {
        res.status(200).send(comments);
      }
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const commentsController = new BaseController<IComments>(commentsModel);

export { getCommentsByPostId, commentsController };
