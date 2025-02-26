import mongoose from "mongoose";

export interface IPost {
  title: string;
  content: string;
  sender: string;
  likes?: string[];
  createdAt?: Date;
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
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  createdAt: { type: Date, default: Date.now },
});

postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

const Posts = mongoose.model<IPost>("Posts", postSchema);

export default Posts;
