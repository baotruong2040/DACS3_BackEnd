const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");

jest.mock("../src/db/query", () => ({
  executeQuery: jest.fn(),
  withTransaction: jest.fn(),
}));

jest.mock("../src/services/fcmService", () => ({
  fireAndForgetPush: jest.fn(),
}));

const { executeQuery } = require("../src/db/query");
const { fireAndForgetPush } = require("../src/services/fcmService");
const { env } = require("../src/config/env");
const { ROLES } = require("../src/constants/roles");
const { usersRouter } = require("../src/routes/usersRoutes");
const { ordersRouter } = require("../src/routes/ordersRoutes");
const { errorHandler } = require("../src/middleware/errorHandler");

function buildToken(userId = 99, role = ROLES.CUSTOMER) {
  return jwt.sign({ user_id: userId, role }, env.JWT_SECRET, { expiresIn: "5m" });
}

describe("FCM Notification Integration", () => {
  const app = express();
  app.use(express.json());
  app.use("/api", usersRouter);
  app.use("/api", ordersRouter);
  app.use(errorHandler);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("PATCH /api/users/fcm-token updates the current user's token", async () => {
    executeQuery.mockResolvedValue({ affectedRows: 1 });

    const response = await request(app)
      .patch("/api/users/fcm-token")
      .set("Authorization", `Bearer ${buildToken(10, ROLES.CUSTOMER)}`)
      .send({ fcm_token: "test-token-123" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("FCM token updated successfully");
    expect(executeQuery).toHaveBeenCalledWith(
      "UPDATE users SET fcm_token = ? WHERE id = ? AND is_deleted = 0",
      ["test-token-123", 10]
    );
  });

  test("PUT /api/orders/:id/status sends push notification to customer", async () => {
    // 1. Mock finding the order and customer's fcm_token
    executeQuery.mockResolvedValueOnce([
      {
        id: 1,
        user_id: 20,
        status: "PENDING",
        fcm_token: "customer-fcm-token",
      },
    ]);
    // 2. Mock updating status
    executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
    // 3. Mock createNotification (database)
    executeQuery.mockResolvedValueOnce({ insertId: 500 });

    const response = await request(app)
      .put("/api/orders/1/status")
      .set("Authorization", `Bearer ${buildToken(99, ROLES.STAFF)}`)
      .send({ status: "PREPARING" });

    expect(response.status).toBe(200);
    expect(fireAndForgetPush).toHaveBeenCalledWith(
      ["customer-fcm-token"],
      "Order status updated",
      "Order #1 is now PREPARING",
      { order_id: "1", status: "PREPARING" }
    );
  });

  test("PUT /api/orders/:id/status does not send push if customer has no token", async () => {
    executeQuery.mockResolvedValueOnce([
      {
        id: 2,
        user_id: 21,
        status: "PENDING",
        fcm_token: null,
      },
    ]);
    executeQuery.mockResolvedValueOnce({ affectedRows: 1 });
    executeQuery.mockResolvedValueOnce({ insertId: 501 });

    const response = await request(app)
      .put("/api/orders/2/status")
      .set("Authorization", `Bearer ${buildToken(99, ROLES.STAFF)}`)
      .send({ status: "PREPARING" });

    expect(response.status).toBe(200);
    expect(fireAndForgetPush).not.toHaveBeenCalled();
  });
});
