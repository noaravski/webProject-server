import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import appInit from "../server";
import userModel from "../models/user_model";
import { IUser } from "../models/user_model";

let app: Express;

type User = IUser & {
  refreshToken?: string;
  _id?: string;
};

const testUser: User = {
  email: "aiuser@gmail.com",
  username: "aiuser",
  password: "AiUser123",
};

beforeAll(async () => {
  console.log("[*] Before AI tests run");
  app = await appInit();

  // Clean up database
  await userModel.deleteMany();

  // Create test user
  const userResponse = await request(app).post("/user").send(testUser);
  expect(userResponse.statusCode).toBe(201);

  const loginResponse = await request(app).post("/user/login").send({
    email: testUser.email,
    password: testUser.password,
  });
  expect(loginResponse.statusCode).toBe(200);

  testUser.refreshToken = loginResponse.body.refreshToken;
  testUser._id = loginResponse.body._id;
});

afterAll(async () => {
  console.log("[*] After all AI tests");
  await mongoose.connection.close();
});

describe("AI Controller Tests", () => {
  test("AI -> enhance review content for an existing movie", async () => {
    const reviewContent = { content: "Inception" };

    const response = await request(app)
      .post(`/ai/enhance`)
      .set("authorization", "JWT " + testUser.refreshToken)
      .send(reviewContent);

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Inception");
  });

  test("AI -> enhance review content for a non-existent movie", async () => {
    const reviewContent = { content: "NonExistentMovie123" };

    const response = await request(app)
      .post(`/ai/enhance`)
      .set("authorization", "JWT " + testUser.refreshToken)
      .send(reviewContent);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("I don't know this film");
  });

  test("AI -> enhance review without content", async () => {
    const response = await request(app)
      .post(`/ai/enhance`)
      .set("authorization", "JWT " + testUser.refreshToken)
      .send({});

    expect(response.statusCode).toBe(400);
  });

  test("AI -> invalid request format", async () => {
    const invalidRequest = { invalidField: "Invalid data" };

    const response = await request(app)
      .post(`/ai/enhance`)
      .set("authorization", "JWT " + testUser.refreshToken)
      .send(invalidRequest);

    expect(response.statusCode).toBe(400);
  });
});