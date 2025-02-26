import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import postsModel, { IPost } from "../models/posts_model";
import userModel from "../models/user_model";
import commentsModel, { IComments } from "../models/comments_model";
import testPostsData from "./test_posts.json";
import testCommentsData from "./test_comments.json";
import { Express } from "express";
import { IUser } from "../models/user_model";

let app: Express;

const testUser: IUser = {
  email: "noaravski@gmail.com",
  username: "noa",
  password: "Noaravski123",
};

type Post = IPost & { _id?: string };
type Comment = IComments & { _id?: string; postId?: string };

const testPosts: Post[] = testPostsData;
const testComments: Comment[] = testCommentsData;

beforeAll(async () => {
  console.log("[*] Before comment tests run");
  app = await appInit();
  try {
    await postsModel.deleteMany();
    await userModel.deleteMany();
    await commentsModel.deleteMany();
  } catch (err) {
    console.log("[*] No posts or users to delete!", err);
  }
  await request(app).post("/user").send(testUser);
  const response = await request(app).post("/user/login").send(testUser);
  testUser.refreshToken = response.body.refreshToken;
  testUser._id = response.body._id;
  expect(response.statusCode).toBe(200);
  for (const post of testPosts) {
    const response = await request(app)
      .post("/")
      .set("authorization", "JWT " + testUser.refreshToken)
      .send(post);
    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe(post.title);
    expect(response.body.content).toBe(post.content);
    post._id = response.body._id;
  }
  testComments[0].postId = testPosts[0]._id;
  testComments[1].postId = testPosts[0]._id;
  testComments[2].postId = testPosts[1]._id;
});

afterAll(() => {
  console.log("[*] After all tests");
  mongoose.connection.close();
});

describe("Comments Test", () => {
  test("Comment -> create new comments (test_comments.json)", async () => {
    for (const comment of testComments) {
      const response = await request(app)
        .post("/add-comment")
        .set("authorization", "JWT " + testUser.refreshToken)
        .send(comment);
      expect(response.statusCode).toBe(201);
      expect(response.body.postId).toBe(comment.postId);
      expect(response.body.sender).toBe(comment.sender);
      expect(response.body.content).toBe(comment.content);
      expect(response.body._id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      comment._id = response.body._id;
    }
  });

  test("Comment -> get comment by id", async () => {
    const response = await request(app).get("/comment/" + testComments[0]._id);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(testComments[0]._id);
  });

  test("Comment -> get comment by invalid id", async () => {
    const response = await request(app).get("/comment/" + "AAA");
    expect(response.statusCode).toBe(400);
  });

  test("Comment -> get comments by postId", async () => {
    const response = await request(app).get("/comments/" + testPosts[0]._id);
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].sender).toBe(testUser.username);
  });

  test("Comment -> get comments by non existing postId", async () => {
    const response = await request(app).get(
      "/comments/" + "AAAAAAAAAAAAAAAAAAAAAAAA"
    );
    expect(response.statusCode).toBe(404);
  });

  test("Comment -> get comments by invalid postId", async () => {
    const response = await request(app).get("/comments/" + "AAA");
    expect(response.statusCode).toBe(400);
  });

  test("Comment -> Delete comment", async () => {
    const response = await request(app)
      .delete("/comment/" + testComments[0]._id)
      .set("authorization", "JWT " + testUser.refreshToken);
    expect(response.statusCode).toBe(200);

    const responseGet = await request(app).get(
      "/comment/" + testComments[0]._id
    );
    expect(responseGet.statusCode).toBe(404);
  });

  test("Comment -> Delete non existing comment", async () => {
    const response = await request(app)
      .delete("/comment/" + "AAAAAAAAAAAAAAAAAAAAAAAA") //AAAAAAAAAAAAAAAAAAAAAAAA - is valid id but not existing one
      .set("authorization", "JWT " + testUser.refreshToken);
    expect(response.statusCode).toBe(404);
  });

  test("Comment -> Delete comment with invalid id", async () => {
    const response = await request(app)
      .delete("/comment/" + "AAA") //AAA - is invalid id
      .set("authorization", "JWT " + testUser.refreshToken);
    expect(response.statusCode).toBe(400);
  });

  test("Comment -> Failed to create new comment", async () => {
    const response = await request(app)
      .post("/add-comment")
      .set("authorization", "JWT " + testUser.refreshToken)
      .send({
        content: "Test Content 1",
      });
    expect(response.statusCode).toBe(400);
  });
});
