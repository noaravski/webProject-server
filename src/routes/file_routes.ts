import express from "express";
import { uploadMiddleware } from "../middleware/uploadService";
import { authMiddleware } from "../controllers/user_controller";
import { createPost } from "../controllers/posts_controller";

const router = express.Router();

router.post("/api/upload/:userId", authMiddleware, uploadMiddleware, (req, res) => {
  if (req.file) {
    res.status(200).send("File uploaded successfully - " + req.file.filename);
  } else {
    res.status(400).send("No file uploaded.");
  }
});

router.post("/api/post", authMiddleware, uploadMiddleware, (req, res) => {
  // console.log(req.body);
  console.log(req.file.filename);
  if (req.file) {
    createPost({ ...req.body, sender: req.params.userId, imageUrl: req.file.filename });
    res.status(200).send("File uploaded successfully - " + req.file.filename);
  } else {
    res.status(400).send("No file uploaded.");
  }
});

export default router;
