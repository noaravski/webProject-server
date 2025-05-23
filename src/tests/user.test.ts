import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import { Express } from "express";
import userModel, { IUser } from "../models/user_model";

jest.mock("google-auth-library", () => {
  const originalModule = jest.requireActual("google-auth-library");
  return {
    ...originalModule,
    OAuth2Client: jest.fn().mockImplementation(() => ({
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: jest.fn().mockReturnValue({
          email: "movierator123@gmail.com",
          name: "test",
          sub: "110274800812615766437",
        }),
      }),
    })),
  };
});

let app: Express;

beforeAll(async () => {
  console.log("[*] Before users tests run");
  app = await initApp();
  await userModel.deleteMany();
  await postModel.deleteMany();
});

afterAll((done) => {
  console.log("[*] After users tests run");
  mongoose.connection.close();
  done();
});

const baseUrl = "/user";

type User = IUser & {
  accessToken?: string;
};

const testUser: User = {
  email: "noaravski@gmail.com",
  username: "noa",
  password: "Noaravski123",
};

describe("Users Tests", () => {
  test("User -> register (createUser) success", async () => {
    const response = await request(app).post(baseUrl).send(testUser);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
    testUser._id = response.body._id;

    expect(response.statusCode).toBe(201);
  });

  test("User -> register (createUser) fail - missing fields", async () => {
    const response = await request(app).post(baseUrl).send({
      email: "abcdefg",
    });
    expect(response.statusCode).not.toBe(200);

    const response2 = await request(app).post(baseUrl).send({
      email: "",
      password: "abcdefg",
    });
    expect(response2.statusCode).not.toBe(200);
  });

  test("User -> Login success", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);

    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(response.body._id).toBeDefined();
    testUser.accessToken = accessToken;
    testUser.refreshToken = refreshToken;
    testUser._id = response.body._id;
  });

  test("User -> tokens are random", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    const accessToken = response.body.accessToken;
    const refreshToken = response.body.refreshToken;

    expect(accessToken).not.toBe(testUser.accessToken);
    expect(refreshToken).not.toBe(testUser.refreshToken);
  });

  test("User -> Login fail", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: testUser.email,
        password: "abcdefg",
      });
    expect(response.statusCode).not.toBe(200);

    const response2 = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: "dsfasd",
        password: "sdfsd",
      });
    expect(response2.statusCode).not.toBe(200);
  });

  test("User -> create post without user", async () => {
    const response = await request(app).post("/").send({
      title: "Test title",
      content: "Test content",
      sender: "notExistingUser",
    });
    expect(response.statusCode).not.toBe(201);
    const response2 = await request(app)
      .post("/")
      .set({ authorization: "JWT " + testUser.refreshToken })
      .send({
        title: "Test title",
        content: "Test content",
        sender: testUser.username,
      });
    expect(response2.statusCode).toBe(200);
  });

  test("User -> get refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .set({ authorization: "JWT " + testUser.refreshToken });
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
  });

  test("User -> use refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .set({ authorization: "JWT " + testUser.refreshToken });

    expect(response.statusCode).toBe(200);
    const refreshTokenNew = response.body.refreshToken;

    const response2 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response2.statusCode).not.toBe(200);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: refreshTokenNew,
      });
    expect(response3.statusCode).not.toBe(200);
  });

  test("User -> Logout", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    const response2 = await request(app)
      .post(baseUrl + "/logout")
      .set({ authorization: "JWT " + testUser.refreshToken });
    expect(response2.statusCode).toBe(200);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response3.statusCode).not.toBe(200);
  });

  jest.setTimeout(10000);
  test("User -> timeout token ", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(200);
    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response2 = await request(app)
      .post("/")
      .set({ authorization: "JWT " + testUser.refreshToken })
      .send({
        title: "Test Post",
        content: "Test Content",
        sender: "abcedfg",
      });
    expect(response2.statusCode).not.toBe(201);

    const response3 = await request(app)
      .post(baseUrl + "/refresh")
      .set({ authorization: "JWT " + testUser.refreshToken });
    expect(response3.statusCode).toBe(200);
    testUser.accessToken = response3.body.accessToken;

    const response4 = await request(app)
      .post("/")
      .set({ authorization: "JWT " + testUser.refreshToken })
      .send({
        title: "Test Post",
        content: "Test Content",
        sender: "abcdefg",
      });
    expect(response4.statusCode).toBe(200);
  });

  test("User -> fail to create (user exists)", async () => {
    if (await userModel.findOne({ username: testUser.username })) {
      await userModel.deleteOne({ username: testUser.username });
    }
    const response = await request(app).post(baseUrl).send(testUser);
    expect(response.statusCode).toBe(201);

    testUser.accessToken = response.body.accessToken;
    testUser.refreshToken = response.body.refreshToken;
    testUser._id = response.body._id;

    const response2 = await request(app).post(baseUrl).send(testUser);
    expect(response2.statusCode).not.toBe(201);
  });

  test("User -> login with non existing user", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: "notExistingEmail",
        username: "notExistingUsername",
        password: "noteExistingPassword",
      });
    expect(response.statusCode).not.toBe(200);
  });
  test("User -> login fail incorrect password", async () => {
    const response = await request(app)
      .post(baseUrl + "/login")
      .send({
        email: testUser.email,
        username: testUser.username,
        password: "incorrectPassword",
      });
    expect(response.statusCode).not.toBe(200);
  });
  test("User -> login with invalid token_secret in .env", async () => {
    const prev = process.env.TOKEN_SECRET;
    process.env.TOKEN_SECRET = "";

    const response = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response.statusCode).toBe(500);

    process.env.TOKEN_SECRET = prev;
  });

  test("User -> Logout with invalid token_secret in .env", async () => {
    const prev = process.env.TOKEN_SECRET;
    process.env.TOKEN_SECRET = "";

    const response = await request(app)
      .post(baseUrl + "/logout")
      .send(testUser);
    expect(response.statusCode).toBe(400);

    process.env.TOKEN_SECRET = prev;
  });

  test("User -> Logout without refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/logout")
      .send({
        refreshToken: null,
      });
    expect(response.statusCode).not.toBe(200);
  });
  test("User -> Logout with invalid refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/logout")
      .send({
        refreshToken: "abcdefg",
      });
    expect(response.statusCode).not.toBe(200);
  });
  test("User -> Logout with vaild refresh token and non existing user", async () => {
    const response = await request(app)
      .post(baseUrl + "/logout")
      .send({
        refreshToken: testUser.refreshToken,
      });
    expect(response.statusCode).not.toBe(200);
  });
  test("User -> refresh with invalid token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken: "AAA",
      });
    expect(response.statusCode).toBe(400);
  });
  test("User -> refresh with valid token not existing", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send({
        refreshToken:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Nzc5NzNiYzE4YjIyNWZhOGIyZDZmZDQiLCJyYW5kb20iOiIwLjE3NjQ0MzU0MDc2NzEwMzIyIiwiaWF0IjoxNzM2MDEyNzMzLCJleHAiOjE3MzY2MTc1MzN9.Z9qt7VSIeoSgdj_uKZr-Hxlz8sUEF06B9mbrwJN1uzY",
      });
    expect(response.statusCode).toBe(400);
  });
  test("User -> refresh with invalid token_secret in .env", async () => {
    const prev = process.env.TOKEN_SECRET;
    process.env.TOKEN_SECRET = "";

    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send(testUser);
    expect(response.statusCode).toBe(400);

    process.env.TOKEN_SECRET = prev;
  });
  test("User -> refresh without token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send();
    expect(response.statusCode).toBe(400);
  });

  test("User -> refresh token", async () => {
    const response = await request(app)
      .post(baseUrl + "/refresh")
      .send();
    expect(response.statusCode).toBe(400);
  });

  test("User -> update user success", async () => {
    const tokenResponse = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    testUser.refreshToken = testUser.refreshToken || [];
    testUser.refreshToken.push(tokenResponse.body.refreshToken);

    const response = await request(app)
      .put(baseUrl + "/" + testUser._id)
      .set({ authorization: "JWT " + testUser.refreshToken })
      .send({
        username: "idan",
      });
    expect(response.statusCode).toBe(200);
  });
  test("User -> update user to existing one", async () => {
    const response = await request(app)
      .put(baseUrl + "/AAAAAAAAAAAAAAAAAAAAAAAA")
      .set({ authorization: "JWT " + testUser.refreshToken })
      .send({
        username: testUser.username,
      });
    expect(response.statusCode).toBe(400);
  });
  test("User -> delete user success", async () => {
    const response = await request(app)
      .delete(baseUrl + "/" + testUser._id)
      .send({
        username: testUser.username,
      });
    expect(response.statusCode).toBe(200);

   //register and login after deletion  
    const response1 = await request(app).post(baseUrl).send(testUser);
    testUser._id = response1.body._id;
    expect(response1.statusCode).toBe(201);
    const response2 = await request(app)
      .post(baseUrl + "/login")
      .send(testUser);
    expect(response2.statusCode).toBe(200);
    testUser.accessToken = response2.body.accessToken;
    testUser.refreshToken = response2.body.refreshToken;
  });
  test("User -> delete non existing user", async () => {
    const response = await request(app)
      .delete(baseUrl + "/AAAAAAAAAAAAAAAAAAAAAAAA")
      .send({
        username: testUser.username,
      });
    expect(response.statusCode).toBe(404);
  });

  test("User -> Google login fail (missing credential)", async () => {
    const response = await request(app)
      .post(baseUrl + "/login/google")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("missing");
  });

  test("User -> Get user details success", async () => {
    try {
      const response = await request(app)
        .get(baseUrl + "/details/" + testUser._id)
        .set({ authorization: "JWT " + testUser.refreshToken });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("_id", testUser._id);
    } catch (error) {
    }
  });

  test("User -> Google login success", async () => {
    const mockGoogleCredential = "mock-google-credential";

    const response = await request(app)
      .post("/user/login/google")
      .send({ credential: mockGoogleCredential });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toMatch(/^eyJ/);
  });

  test("User -> Get user posts success", async () => {
    const response = await request(app)
      .get(baseUrl + "/posts/" + testUser.username)
      .set({ authorization: "JWT " + testUser.refreshToken });

    expect(response.statusCode).toBe(200);
  });

  test("User -> Get user posts fail (non-existent user)", async () => {
    const response = await request(app)
      .get(baseUrl + "/posts/AAAAAAAAAAAAAAAAAAAAAAAA")
      .set({ authorization: "JWT " + testUser.refreshToken });

    expect(response.statusCode).toBe(404);
  });
});
