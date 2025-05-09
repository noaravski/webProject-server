import mongoose from "mongoose";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import express, { Express } from "express";
import postsRoute from "./routes/posts_routes";
import commentsRoute from "./routes/comments_routes";
import userRoutes from "./routes/users_routes";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import fileRoutes from "./routes/file_routes";
import aiRoutes from "./routes/ai_routes";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/front", express.static("front"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", postsRoute);
app.use("/", commentsRoute);
app.use("/user", userRoutes);
app.use("/", fileRoutes);
app.use("/ai", aiRoutes);
app.use("/images", express.static("./uploads"));

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: "https:///node94.cs.colman.ac.il:4000" }],
  },
  apis: [`${__dirname}/routes/*.ts`, `${__dirname}/routes/*.js`],
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to database"));

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    if (!process.env.DB_CONNECT) {
      reject("DB_CONNECT is not defined in .env file");
    } else {
      mongoose
        .connect(process.env.DB_CONNECT)
        .then(() => {
          console.log("Connected to database from initApp");
          resolve(app);
        })
        .catch((error) => {
          console.error("Error connecting to database:", error);
          reject(error);
        });
    }
  });
};

export default initApp;
