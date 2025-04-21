import mongoose from "mongoose";

export interface IComments {
  content: string;
  postId?: string;
  sender: string;
  createdAt?: Date;
  senderId?: mongoose.Schema.Types.ObjectId;
}

const commentsSchema = new mongoose.Schema<IComments>({
  postId: {
    type: String,
    ref: "Posts",
    required: true,
  },
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
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const commentsModel = mongoose.model<IComments>("Comments", commentsSchema);

export default commentsModel;
