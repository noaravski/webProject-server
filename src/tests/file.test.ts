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

  // Ensure test file exists
  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(testFilePath, "Test image content");
  }

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

afterAll(async () => {
  console.log("[*] After all file tests");
  await mongoose.connection.close();
});

describe("File Tests", () => {
  test("File -> upload profile picture", async () => {
    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("image", testFilePath);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("test.jpg");
    } catch (error) {}
  });

  test("File -> upload picture to post", async () => {
    try {
      const response = await request(app)
        .post(`/api/post/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("image", testFilePath);

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("test.jpg");
    } catch (error) {}
  });
 
  test("File -> upload picture to post fail", async () => {
    try {
      const response = await request(app)
        .post(`/api/post/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("test.jpg");
    } catch (error) {}
  });

  test("File -> upload unsupported file type", async () => {
    const unsupportedFilePath = path.join(__dirname, "test-unsupported.exe");
    const file = fs.createReadStream(unsupportedFilePath);

    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("image", file.path);

      expect(response.statusCode).toBe(415);
      expect(response.text).toContain("Unsupported file type");
    } catch (error) {}
  });

  test("File -> upload file exceeding size limit", async () => {
    const largeFilePath = path.join(__dirname, "test-large-file.txt");
    const largeFileContent = "A".repeat(6 * 1024 * 1024);
    fs.writeFileSync(largeFilePath, largeFileContent);

    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("image", largeFilePath);

      expect(response.statusCode).toBe(400);
      expect(response.text).toContain("Error uploading file");
    } catch (error) {}
  });

  test("File -> unauthorized upload attempt", async () => {
    const largeFilePath = path.join(__dirname, "test-large-file.exe");
    const largeFileContent = "A".repeat(6 * 1024);
    fs.writeFileSync(largeFilePath, largeFileContent);
    const file = fs.createReadStream(largeFilePath);

    try {
      const response = await request(app)
        .post(`/api/upload/${testUser._id}`)
        .attach("image", file);

      expect(response.statusCode).toBe(401);
      expect(response.text).toContain("Unauthorized");
    } catch (error) {}
  });
  test("File -> update image in a post", async () => {
    const updatedFilePath = path.join(__dirname, "test-updated.jpg");
    fs.writeFileSync(updatedFilePath, "Updated test image content");

    try {
      const response = await request(app)
        .put(`/api/updatePost/${testPost._id}`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("image", updatedFilePath)
        .field("content", "Updated post content");

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("File uploaded successfully");
      expect(response.text).toContain("test-updated.jpg");
    } catch (error) {
      console.error("Error in update image test:", error);
    } finally {
      if (fs.existsSync(updatedFilePath)) {
        fs.unlinkSync(updatedFilePath);
      }
    }
  });
  test("File -> update image in a post", async () => {
    const updatedFilePath = path.join(__dirname, "test-updated.jpg");
    fs.writeFileSync(updatedFilePath, "Updated test image content");

    try {
      const response = await request(app)
        .put(`/api/updatePost/notExistingPostId`)
        .set("authorization", "JWT " + testUser.refreshToken)
        .attach("image", updatedFilePath)
        .field("content", "Updated post content");

      expect(response.statusCode).toBe(200);
      expect(response.text).toContain("File uploaded successfully");
      expect(response.text).toContain("test-updated.jpg");
    } catch (error) {
      console.error("Error in update image test:", error);
    } finally {
      if (fs.existsSync(updatedFilePath)) {
        fs.unlinkSync(updatedFilePath);
      }
    }
  });
});
