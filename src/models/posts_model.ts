import mongoose from "mongoose";

export interface IPost {
  title: string;
  content: string;
  sender: string;
}

const postSchema = new mongoose.Schema<IPost>({
  title: {
    type: String,
    required: true,
  },
  content: String,
  sender: {
    type: String,
    ref: "Users",
    required: true,
  },
});

const Posts = mongoose.model<IPost>("Posts", postSchema);

export default Posts;
