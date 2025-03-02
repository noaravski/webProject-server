import mongoose from "mongoose";

export interface IPost {
  content: string;
  sender: string;
  likes?: string[];
  createdAt?: Date;
  imageUrl?: string;
}

const postSchema = new mongoose.Schema<IPost>({
  content: String,
  sender: {
    type: String,
    ref: "Users",
    required: true,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  createdAt: { type: Date, default: Date.now },
  imageUrl: {
    type: String,
    required: true,
  },
});

const Posts = mongoose.model<IPost>("Posts", postSchema);

export default Posts;
