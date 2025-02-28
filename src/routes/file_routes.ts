import express from "express";
import { uploadMiddleware } from "../middleware/uploadService";
import { authMiddleware } from "../controllers/user_controller";

const router = express.Router();

router.post("/api/upload/:userId", authMiddleware, uploadMiddleware, (req, res) => {
  if (req.file) {
    res.status(200).send("File uploaded successfully - " + req.file.filename);
  } else {
    res.status(400).send("No file uploaded.");
  }
});

export default router;
