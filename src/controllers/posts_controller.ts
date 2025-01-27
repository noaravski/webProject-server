import postModel, { IPost } from "../models/posts_model";
import commentModel from "../models/comments_model";
import BaseController from "./base_controller";
import { Request, Response } from "express";

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

export { postController, deletePost };
