const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { refreshTokens, users, posts } = require("../utils");
const { postsForTests } = require("./testData");

posts.length = 0;
posts.unshift(...postsForTests);

jest.mock("jsonwebtoken");
jest.mock("bcrypt");

const app = require("../app");
process.env.ACCESS_TOKEN_SECRET = "some-secret";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret";

describe("", () => {
  beforeEach(() => {
    bcrypt.hash.mockImplementation((value) => value + "$");
    bcrypt.compare.mockImplementation(
      (value1, value2) => bcrypt.hash(value1) === value2
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe("auth/signup (POST)", () => {
    it("signs up user and returns '{ result: 'Signup is successful' }'", async () => {
      users.length = 0;
      const payload = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq",
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({ result: "Signup is successful" });
    });
    it("calls bycrypt.hash and stores user with hashed password in users array", async () => {
      users.length = 0;
      const payload = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq",
      };
      const hashSpy = jest.spyOn(bcrypt, "hash");
      const response = await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json");

      expect(hashSpy).toBeCalledTimes(1);
      expect(hashSpy.mock.calls[0][0]).toBe(payload.password);
      expect(users[0].password).toBe(payload.password + "$");
    });
    it("does not signs up user if user with this username already exists", async () => {
      const payload = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq",
      };
      users.length = 0;

      await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      const response = await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(422);

      expect(response.body).toEqual({
        errors: [
          {
            msg: "This user already exists",
          },
        ],
      });
    });
  });

  describe("auth/login (POST)", () => {
    it("allows user to login with credentials he signed up with and returns 2 tokens", async () => {
      const payload = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq",
      };
      users.length = 0;
      jest.spyOn(jwt, "sign").mockImplementation((_, token) => {
        if (token === process.env.ACCESS_TOKEN_SECRET) return "some-token";
        if (token === process.env.REFRESH_TOKEN_SECRET) return "other-token";
        return `wrong token because neither ACCESS_TOKEN_SECRET nor REFRESH_TOKEN_SECRET 
        environment variables were used for generation`;
      });

      await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json");

      const response = await request(app)
        .post("/auth/login")
        .send(payload)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({
        accessToken: "some-token",
        refreshToken: "other-token",
      });
    });
    it(`does not allow user to login when password is wrong 
        and returns 404 status with error message`, async () => {
      const payload = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq",
      };
      const wrongPasswordCreds = {
        username: "Smith",
        password: "d%3490gL@Sd12Aq",
      };
      users.length = 0;

      await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json");

      const response = await request(app)
        .post("/auth/login")
        .send(wrongPasswordCreds)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toEqual({
        errors: [
          {
            msg: "Invalid Credentials",
          },
        ],
      });
    });
    it(`does not allow user to login when login is wrong 
        and returns 404 status with error message`, async () => {
      const payload = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq",
      };
      const wrongPasswordCreds = {
        username: "Smithh",
        password: "sd%3490gL@Sd12Aq",
      };
      users.length = 0;

      await request(app)
        .post("/auth/signup")
        .send(payload)
        .set("Accept", "application/json");

      const response = await request(app)
        .post("/auth/login")
        .send(wrongPasswordCreds)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(404);

      expect(response.body).toEqual({
        errors: [
          {
            msg: "Invalid Credentials",
          },
        ],
      });
    });
  });

  describe("auth/token (POST)", () => {
    it(`allows user to get new valid token using refresh token
          and calls jwt sign and verify functions with correct arguments`, async () => {
      const signedUpUser = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq$",
      };
      const payload = { token: "other-token" };
      users.length = 0;
      refreshTokens.length = 0;
      users.push(signedUpUser);
      refreshTokens.push(payload.token);
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback(null, signedUpUser)
        );
      const signSpy = jest.spyOn(jwt, "sign").mockReturnValueOnce("new-token");

      const response = await request(app)
        .post("/auth/token")
        .send(payload)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toEqual({ accessToken: "new-token" });
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.REFRESH_TOKEN_SECRET);
      expect(signSpy).toHaveBeenCalledTimes(1);
    });
    it(`returns 403 status code and does not allow user to get new valid token 
          using refresh token if token is not valid`, async () => {
      const signedUpUser = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq$",
      };
      const payload = { token: "other-token" };
      users.length = 0;
      refreshTokens.length = 0;
      users.push(signedUpUser);
      refreshTokens.push(payload.token);
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback("corrupted-token")
        );

      const response = await request(app)
        .post("/auth/token")
        .send(payload)
        .set("Accept", "application/json")
        .expect(403);

      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.REFRESH_TOKEN_SECRET);
    });
    it(`returns 403 status code and does not allow user to get new valid token 
          using refresh token if refresh token is not in the refreshTokens array (user is logged out)`, async () => {
      const signedUpUser = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq$",
      };
      const payload = { token: "other-token" };
      users.length = 0;
      refreshTokens.length = 0;
      users.push(signedUpUser);
      jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback(null, signedUpUser)
        );

      await request(app)
        .post("/auth/token")
        .send(payload)
        .set("Accept", "application/json")
        .expect(403);
    });
  });

  describe("auth/logout (DELETE)", () => {
    it(`removes refresh token from refresh tokens array`, async () => {
      const payload = { token: "refresh-token" };
      refreshTokens.length = 0;
      refreshTokens.unshift("refresh-token", "other-refresh-token");

      await request(app)
        .delete("/auth/logout")
        .send(payload)
        .set("Accept", "application/json")
        .expect(204);

      expect(refreshTokens).toEqual(["other-refresh-token"]);
    });
  });
  describe("/posts (GET)", () => {
    it(`returns all posts to authenticated user, calls jwt verify`, async () => {
      const signedUpUser = {
        username: "Smith",
        password: "sd%3490gL@Sd12Aq$",
      };
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback(null, signedUpUser)
        );

      const response = await request(app)
        .get("/posts")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(200);

      expect(response.body).toEqual(posts);
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 403 status code if authentication fails`, async () => {
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback("corrupted-token")
        );

      await request(app)
        .get("/posts")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(403);

      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 401 if there is no authorization attribute`, async () => {
      await request(app)
        .get("/posts")
        .set("Accept", "application/json")
        .expect(401);
    });
    it(`returns 401 if there is authorization token but token cannot be retrieved`, async () => {
      await request(app)
        .get("/posts")
        .set("Accept", "application/json")
        .set("Authorization", "some-token") //there is no bearer prefix here which should be expected
        .expect(401);
    });
  });

  describe("/posts/my (GET)", () => {
    it(`returns user's posts to authenticated user, calls jwt verify`, async () => {
      const jwtUser = {
        name: "Davis",
      };
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) => callback(null, jwtUser));

      const response = await request(app)
        .get("/posts/my")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(200);

      expect(response.body).toEqual(
        posts.filter((post) => post.author === jwtUser.name)
      );
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 403 status code if authentication fails`, async () => {
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback("corrupted-token")
        );

      await request(app)
        .get("/posts/my")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(403);

      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 401 if there is no authorization attribute`, async () => {
      await request(app)
        .get("/posts/my")
        .set("Accept", "application/json")
        .expect(401);
    });
    it(`returns 401 if there is authorization token but token cannot be retrieved`, async () => {
      await request(app)
        .get("/posts")
        .set("Accept", "application/json")
        .set("Authorization", "some-token") //there is no bearer prefix here which should be expected
        .expect(401);
    });
  });

  describe("/posts/:id (PATCH)", () => {
    it(`returns post to authenticated user if the post belongs to user, calls jwt verify`, async () => {
      const jwtUser = {
        name: "Anderson",
      };
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) => callback(null, jwtUser));

      const response = await request(app)
        .patch("/posts/3")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(200);

      expect(response.body).toEqual(posts[3]);
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 403 status code to authenticated user if the post does not belong to him, calls jwt verify`, async () => {
      const jwtUser = {
        name: "Anderson",
      };
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) => callback(null, jwtUser));

      await request(app)
        .patch("/posts/2")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(403);

      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 403 status code if authentication fails`, async () => {
      const verifySpy = jest
        .spyOn(jwt, "verify")
        .mockImplementationOnce((_, __, callback) =>
          callback("corrupted-token")
        );

      await request(app)
        .patch("/posts/3")
        .set("Accept", "application/json")
        .set("Authorization", "Bearer some-token")
        .expect(403);

      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(verifySpy.mock.calls[0][1]).toBe(process.env.ACCESS_TOKEN_SECRET);
    });
    it(`returns 401 if there is no authorization attribute`, async () => {
      await request(app)
        .patch("/posts/3")
        .set("Accept", "application/json")
        .expect(401);
    });
    it(`returns 401 if there is authorization token but token cannot be retrieved`, async () => {
      await request(app)
        .patch("/posts/3")
        .set("Accept", "application/json")
        .set("Authorization", "some-token") //there is no bearer prefix here which should be expected
        .expect(401);
    });
  });
});
