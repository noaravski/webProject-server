import fs from "fs";
import path from "path";

export const generateUsersLibrary = (userId: string) => {
  const uploadsPath = path.join(__dirname, `uploads/${userId}`);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
};
