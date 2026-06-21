const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/db/query", () => ({
  executeQuery: jest.fn(),
}));

const { executeQuery } = require("../src/db/query");
const { usersRouter } = require("../src/routes/usersRoutes");
const { errorHandler } = require("../src/middleware/errorHandler");
const { env } = require("../src/config/env");
const { ROLES } = require("../src/constants/roles");

function buildToken(userId, role) {
  return jwt.sign({ user_id: userId, role }, env.JWT_SECRET, { expiresIn: "5m" });
}

describe("User Profile Endpoints (GET & PUT /users/me)", () => {
  const app = express();
  app.use(express.json());
  app.use("/api", usersRouter);
  app.use(errorHandler);

  beforeEach(() => {
    executeQuery.mockReset();
  });

  describe("GET /api/users/me", () => {
    test("returns user profile details for a logged-in user", async () => {
      const token = buildToken(16, ROLES.CUSTOMER);
      const mockProfile = {
        id: 16,
        username: "riyaki",
        full_name: "Huỳnh Ngọc Bảo Trường",
        email: "truongyasuo@gmail.com",
        phone: "0819033106",
        address: "11 leloi",
        role: ROLES.CUSTOMER,
        created_at: "2026-05-15T11:13:19.000Z",
      };

      executeQuery.mockResolvedValueOnce([mockProfile]);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "success",
        message: "User profile fetched successfully",
        data: mockProfile,
      });

      expect(executeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT id, username, full_name, email, phone, address, role, created_at"),
        [16]
      );
    });

    test("returns 404 if user not found in database", async () => {
      const token = buildToken(99, ROLES.CUSTOMER);
      executeQuery.mockResolvedValueOnce([]);

      const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("User not found");
    });

    test("returns 401 if authentication token is missing", async () => {
      const response = await request(app).get("/api/users/me");

      expect(response.status).toBe(401);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Authentication token is required");
    });
  });

  describe("PUT /api/users/me", () => {
    test("successfully updates profile details", async () => {
      const token = buildToken(16, ROLES.CUSTOMER);
      
      // 1. SELECT user check (exists)
      executeQuery.mockResolvedValueOnce([{ id: 16 }]);
      // 2. UPDATE query success
      executeQuery.mockResolvedValueOnce({ affectedRows: 1 });

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          full_name: "Huỳnh Ngọc Bảo Trường New",
          phone: "0819033107",
          address: "12 leloi",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "success",
        message: "Profile updated successfully",
        data: {
          user_id: 16,
        },
      });

      // Verify DB interactions
      expect(executeQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT id FROM users WHERE id = ? AND is_deleted = 0 LIMIT 1",
        [16]
      );
      expect(executeQuery).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining("UPDATE users SET"),
        ["Huỳnh Ngọc Bảo Trường New", "0819033107", "12 leloi", 16]
      );
    });

    test("checks and handles email duplication checks before updating", async () => {
      const token = buildToken(16, ROLES.CUSTOMER);

      // 1. SELECT user check (exists)
      executeQuery.mockResolvedValueOnce([{ id: 16 }]);
      // 2. Email validation check (duplicate found)
      executeQuery.mockResolvedValueOnce([{ id: 17 }]); // user 17 owns this email

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          email: "taken@example.com",
        });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Email already exists");

      expect(executeQuery).toHaveBeenCalledTimes(2);
      expect(executeQuery).toHaveBeenNthCalledWith(
        2,
        "SELECT id FROM users WHERE email = ? AND id != ? AND is_deleted = 0 LIMIT 1",
        ["taken@example.com", 16]
      );
    });

    test("returns 400 when validation fails (empty payload)", async () => {
      const token = buildToken(16, ROLES.CUSTOMER);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Validation failed");
    });

    test("returns 400 when validation fails (privilege escalation field only)", async () => {
      const token = buildToken(16, ROLES.CUSTOMER);

      const response = await request(app)
        .put("/api/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({
          role: ROLES.ADMIN, // role is ignored/stripped, resulting in empty update object
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Validation failed");
    });
  });
});
