const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { env } = require("../src/config/env");
const { ROLES } = require("../src/constants/roles");
const { authenticate } = require("../src/middleware/authenticate");
const { authorize } = require("../src/middleware/authorize");
const { errorHandler } = require("../src/middleware/errorHandler");

function buildToken(role) {
  return jwt.sign({ user_id: 99, role }, env.JWT_SECRET, { expiresIn: "5m" });
}

describe("auth + rbac middleware", () => {
  const app = express();
  app.get("/protected", authenticate, authorize(ROLES.STAFF), (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use(errorHandler);

  test("returns 401 for missing token", async () => {
    const response = await request(app).get("/protected");
    expect(response.status).toBe(401);
  });

  test("returns 403 for insufficient role", async () => {
    const token = buildToken(ROLES.CUSTOMER);
    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  test("allows access for staff token", async () => {
    const token = buildToken(ROLES.STAFF);
    const response = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});
