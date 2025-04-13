import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import appInit from "../server";
import postsModel from "../models/posts_model";
import userModel from "../models/user_model";
import testPostsData from "./test_posts.json";
import { IUser } from "../models/user_model";
import { IPost } from "../models/posts_model";
import FormData from "form-data";
import fs from "fs";
import path from "path";

let app: Express;

type User = IUser & {
  accessToken?: string;
};

const testUser: User = {
  email: "noaravski@gmail.com",
  username: "noa",
  password: "Noaravski123",
};

type Post = IPost & {
  _id?: string;
};

const testPost: Post = testPostsData[0];

const testFilePath = path.join(__dirname, "test.jpg");

beforeAll(async () => {
  console.log("[*] Before file tests run");
  app = await appInit();

  // Clean up database
  await postsModel.deleteMany();
  await userModel.deleteMany();

  // Create test user
  await request(app).post("/user").send(testUser);
  const loginResponse = await request(app).post("/user/login").send({
    email: testUser.email,
    password: testUser.password,
  });

  testUser.refreshToken = loginResponse.body.refreshToken;
  testUser._id = loginResponse.body._id;

  // Create test post
  const postResponse = await request(app)
    .post("/")
    .set("authorization", "JWT " + testUser.refreshToken)
    .send(testPost);
  testPost._id = postResponse.body._id;
});

afterAll(() => {
  console.log("[*] After all file tests");
  mongoose.connection.close();
});

describe("File Tests", () => {
  test("File -> upload profile picture", async () => {
    const file = fs.createReadStream(testFilePath);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .set(formData.getHeaders())
        .send(formData);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("File uploaded successfully");
      expect(response.body.filePath).toContain(`/uploads/${testUser._id}`);
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  });

  test("File -> upload picture to post", async () => {
    const file = fs.createReadStream(testFilePath);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await request(app)
        .post(`/api/post/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .set(formData.getHeaders())
        .send(formData);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Image uploaded to post successfully");
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  });

  test("File -> upload without file", async () => {
    const response = await request(app)
      .post(`/api/upload/${testUser._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("No file provided");
  });

  test("File -> upload unsupported file type", async () => {
    const unsupportedFilePath = path.join(__dirname, "test-unsupported.exe");
    const file = fs.createReadStream(unsupportedFilePath);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .set(formData.getHeaders())
        .send(formData);

      expect(response.statusCode).toBe(415);
      expect(response.body.error).toBe("Unsupported file type");
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  });

  test("File -> upload file exceeding size limit", async () => {
    const largeFilePath = path.join(__dirname, "test-large-file.txt");
    const largeFileContent = "A".repeat(6 * 1024 * 1024); // 6MB file
    fs.writeFileSync(largeFilePath, largeFileContent);

    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("file", largeFilePath);

      expect(response.statusCode).toBe(413);
      expect(response.body.error).toBe("File size exceeds limit");
    } catch (error) {
      console.error("Error during file upload:", error);
    }
  });
});
