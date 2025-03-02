import mongoose from "mongoose";

export interface IUser {
  email: string;
  username: string;
  password: string;
  _id?: string;
  refreshToken?: string[];
  description?: string;
  profilePic?: string;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    default: "Here you can write about yourself, your favorite movies...",
  },
  profilePic: {
    type: String,
    // default: "../../images/noProfilePic.png",
  },
});

const userModel = mongoose.model<IUser>("Users", userSchema);

export default userModel;
