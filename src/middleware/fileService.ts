import fs from "fs";
import path from "path";

export const updateUserDir = (userId: string, image: Express.Multer.File) => {
  const newFilePath = `uploads/${userId}/${image.filename}`;
  const uploadsPath = path.join(`uploads/${userId}`);
  
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    fs.renameSync(image.path, newFilePath);
  } catch (err) {
    console.log(err);
  }
};
