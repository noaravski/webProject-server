import mongoose from "mongoose";

export interface IPost {
  content: string;
  sender: string;
  senderId: mongoose.Schema.Types.ObjectId;
  likes?: string[];
  createdAt?: Date;
  imageUrl?: string;
  profilePic?: string;
}

const postSchema = new mongoose.Schema<IPost>({
  content: String,
  sender: {
    type: String,
    ref: "Users",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: false,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
  createdAt: { type: Date, default: Date.now },
  imageUrl: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
    required: false,
  },
});

const Posts = mongoose.model<IPost>("Posts", postSchema);

export default Posts;
