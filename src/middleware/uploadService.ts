import multer from "multer";
import path from "path";
import fs from "fs";

export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir;

    if (!req.params.userId) {
      uploadDir = path.join(__dirname, "../../uploads");
    } else {
      const userId = req.params.userId;
      uploadDir = path.join(__dirname, "../../uploads", userId);
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, and JPG files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadMiddleware = upload.single("image");
