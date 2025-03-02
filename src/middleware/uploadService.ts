import multer from "multer";
import path from "path";
import fs from 'fs';

export const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.params.userId;
    const userDir = path.join(__dirname, "../../uploads", userId);

    // cb(null, path.join(__dirname, "uploads", userId));

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
},);


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
