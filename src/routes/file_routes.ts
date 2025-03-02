import express from "express";
import { uploadMiddleware } from "../middleware/uploadService";
import { authMiddleware } from "../controllers/user_controller";
import { createPost } from "../controllers/posts_controller";

const router = express.Router();

router.post(
  "/api/upload/:userId",
  authMiddleware,
  uploadMiddleware,
  (req, res) => {
    if (req.file) {
      res.status(200).send("File uploaded successfully - " + req.file.filename);
    } else {
      res.status(400).send("No file uploaded.");
    }
  }
);

router.post("/api/post", authMiddleware, uploadMiddleware, async (req, res) => {
  try {
    if (req.file) {
      await createPost({
        ...req.body,
        sender: req.params.username,
        imageUrl: req.file.filename,
      });
      res.status(200).send("File uploaded successfully - " + req.file.filename);
    } else {
      res.status(400).send("No file uploaded.");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Internal server error");
  }
});

export default router;
