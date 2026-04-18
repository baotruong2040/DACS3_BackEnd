const request = require("supertest");
const { app } = require("../src/app");

describe("health endpoint", () => {
  test("returns standard success envelope", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Service is healthy",
      data: {},
    });
  });
});
