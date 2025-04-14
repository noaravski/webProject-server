import request from "supertest";
import appInit from "../server";
import mongoose from "mongoose";
import postsModel, { IPost } from "../models/posts_model";
import userModel from "../models/user_model";
import testPostsData from "./test_posts.json";
import { Express } from "express";
import { IUser } from "../models/user_model";

let app: Express;

const testUser: IUser = {
  email: "noaravski@gmail.com",
  username: "noa",
  password: "Noaravski123",
};

type Post = IPost & {
  _id?: string;
};

const testPosts: Post[] = testPostsData;

beforeAll(async () => {
  console.log("[*] Before post tests run");
  app = await appInit();
  try {
    await postsModel.deleteMany();
    await userModel.deleteMany();
  } catch (err) {
    console.log("[*] No posts or users to delete!", err);
  }
  await request(app).post("/user").send(testUser);
  const response = await request(app).post("/user/login").send(testUser);
  testUser.refreshToken = response.body.refreshToken;
  testUser._id = response.body._id;
});

afterAll(() => {
  console.log("[*] After all tests");
  mongoose.connection.close();
});

describe("Posts Tests", () => {
  test("Post -> get all post when empty", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(0);
  });

  test("Post -> create new posts (test_post.json)", async () => {
    for (const post of testPosts) {
      const response = await request(app)
        .post("/")
        .set("authorization", "JWT " + testUser.refreshToken)
        .send(post);
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe(post.title);
      expect(response.body.content).toBe(post.content);
      expect(response.body.sender).toBe(post.sender);
      post._id = response.body._id;
    }
  });

  test("Post -> get all post (test_post.json)", async () => {
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(testPosts.length);
  });

  test("Post -> get post by id", async () => {
    const response = await request(app).get("/post/" + testPosts[0]._id);
    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(testPosts[0]._id);
  });

  test("Post -> get post by sender", async () => {
    const response = await request(app)
      .get("/post")
      .query({ sender: testUser.username });
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].sender).toBe(testUser.username);
    expect(response.body[0].sender).toBe(testUser.username);
  });

  test("Post -> Delete post", async () => {
    const response = await request(app)
      .delete("/post/" + testPosts[0]._id)
      .set("authorization", "JWT " + testUser.refreshToken);
    expect(response.statusCode).toBe(200);

    const responseGet = await request(app).get("/posts/" + testPosts[0]._id);
    expect(responseGet.statusCode).toBe(404);
  });

  test("Post -> Delete non existing post", async () => {
    const response = await request(app)
      .delete("/post/" + "AAAAAAAAAAAAAAAAAAAAAAAA") //A - is valid id but not existing one
      .set("authorization", "JWT " + testUser.refreshToken);
    expect(response.statusCode).toBe(404);
  });

  test("Post -> Delete post with invalid id", async () => {
    const response = await request(app)
      .delete("/post/" + "AAA") //A - is invalid id
      .set("authorization", "JWT " + testUser.refreshToken);
    expect(response.statusCode).toBe(400);
  });

  test("Post -> Failed to create new post", async () => {
    const response = await request(app)
      .post("/")
      .set("authorization", "JWT " + testUser.refreshToken)
      .send({
        content: "Test Content 1",
      });
    expect(response.statusCode).toBe(500);
  });
  test("Post -> update post", async () => {
    const response = await request(app)
      .put("/post/" + testPosts[1]._id)
      .set("authorization", "JWT " + testUser.refreshToken)
      .send({
        content: "Test Content 1",
      });
    expect(response.statusCode).toBe(200);
  });
  test("Post -> update non existing post existing user", async () => {
    const response = await request(app)
      .put("/post/AAAAAAAAAAAAAAAAAAAAAAAA")
      .set("authorization", "JWT " + testUser.refreshToken)
      .send({
        content: "Test Content 1",
      });
    expect(response.statusCode).toBe(404);
  });

  test("Post -> add like to a post", async () => {
    const response = await request(app)
      .put(`/post/like/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Like added");

    const postResponse = await request(app).get(`/post/${testPosts[1]._id}`);
    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body.likes).toContain(testUser._id);
  });

  test("Post -> add like to a post already liked", async () => {
    await request(app)
      .put(`/post/like/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    const response = await request(app)
      .put(`/post/like/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("already liked");
  });

  test("Post -> remove like from a post", async () => {
    await request(app)
      .put(`/post/like/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    const response = await request(app)
      .put(`/post/unlike/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Like Removed");

    const postResponse = await request(app).get(`/post/${testPosts[1]._id}`);
    expect(postResponse.statusCode).toBe(200);
    expect(postResponse.body.likes).not.toContain(testUser._id);
  });

  test("Post -> remove like from a post not liked", async () => {
    const response = await request(app)
      .put(`/post/unlike/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("not liked by user");
  });

  test("Post -> check if user liked a post (liked)", async () => {
    await request(app)
      .put(`/post/like/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    const response = await request(app)
      .get(`/post/isliked/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.isLiked).toBe(true);
  });

  test("Post -> check if user liked a post (not liked)", async () => {
    const response = await request(app)
      .get(`/post/isliked/${testPosts[1]._id}`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(200);
  });

  test("Post -> add like to non-existent post", async () => {
    const response = await request(app)
      .put(`/post/like/AAAAAAAAAAAAAAAAAAAAAAAA`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(404);
    expect(response.text).toContain("not found");
  });

  test("Post -> remove like from non-existent post", async () => {
    const response = await request(app)
      .put(`/post/unlike/AAAAAAAAAAAAAAAAAAAAAAAA`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(404);
    expect(response.text).toContain("not found");
  });

  test("Post -> check if user liked a non-existent post", async () => {
    const response = await request(app)
      .get(`/post/isliked/AAAAAAAAAAAAAAAAAAAAAAAA`)
      .set("authorization", "JWT " + testUser.refreshToken);

    expect(response.statusCode).toBe(404);
    expect(response.text).toContain("not found");
  });
});
