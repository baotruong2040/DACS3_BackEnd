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
const { env } = require("../src/config/env");
const { ROLES } = require("../src/constants/roles");
const { ordersRouter } = require("../src/routes/ordersRoutes");
const { usersRouter } = require("../src/routes/usersRoutes");
const { errorHandler } = require("../src/middleware/errorHandler");

function buildToken(role = ROLES.STAFF) {
  return jwt.sign({ user_id: 99, role }, env.JWT_SECRET, { expiresIn: "5m" });
}

describe("GET /api/orders", () => {
  const app = express();
  app.use(express.json());
  app.use("/api", ordersRouter);
  app.use("/api", usersRouter);
  app.use(errorHandler);

  beforeEach(() => {
    executeQuery.mockReset();
  });

  test("lists orders for staff with default pagination", async () => {
    executeQuery
      .mockResolvedValueOnce([
        {
          id: 1,
          user_id: 2,
          customer_name: "Nguyen Van A",
          total_amount: "150000.00",
          status: "PENDING",
          delivery_address: "123 Nguyen Hue St",
          created_at: "2026-05-21T01:00:00.000Z",
          updated_at: "2026-05-21T01:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Orders fetched successfully",
      data: {
        items: [
          {
            id: 1,
            user_id: 2,
            customer_name: "Nguyen Van A",
            total_amount: "150000.00",
            status: "PENDING",
            delivery_address: "123 Nguyen Hue St",
            created_at: "2026-05-21T01:00:00.000Z",
            updated_at: "2026-05-21T01:00:00.000Z",
          },
        ],
        page: 1,
        page_size: 20,
        total: 1,
      },
    });
  });

  test("normalizes lowercase status filters", async () => {
    executeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app)
      .get("/api/orders?status=pending&page=1&page_size=10")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(200);
    expect(executeQuery).toHaveBeenNthCalledWith(1, expect.any(String), [
      "PENDING",
      10,
      0,
    ]);
    expect(executeQuery).toHaveBeenNthCalledWith(2, expect.any(String), ["PENDING"]);
  });

  test("handles repeated status query values from clients", async () => {
    executeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app)
      .get("/api/orders?status=pending&status=&page=1&page_size=10")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(200);
    expect(executeQuery).toHaveBeenNthCalledWith(1, expect.any(String), [
      "PENDING",
      10,
      0,
    ]);
  });

  test("treats empty or all status filters as no filter", async () => {
    executeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    const emptyStatusResponse = await request(app)
      .get("/api/orders?status=")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(emptyStatusResponse.status).toBe(200);
    expect(executeQuery).toHaveBeenNthCalledWith(1, expect.any(String), [20, 0]);

    executeQuery.mockReset();
    executeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total: 0 }]);

    const allStatusResponse = await request(app)
      .get("/api/orders?status=all")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(allStatusResponse.status).toBe(200);
    expect(executeQuery).toHaveBeenNthCalledWith(1, expect.any(String), [20, 0]);
  });

  test("returns 400 for invalid pagination", async () => {
    const response = await request(app)
      .get("/api/orders?page=0")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
  });

  test("lists orders for a specific user", async () => {
    executeQuery
      .mockResolvedValueOnce([{ id: 2 }])
      .mockResolvedValueOnce([
        {
          id: 11,
          user_id: 2,
          customer_name: "Tran Thi B",
          total_amount: "250000.00",
          status: "PREPARING",
          delivery_address: "45 Le Loi St",
          created_at: "2026-05-22T01:00:00.000Z",
          updated_at: "2026-05-22T01:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app)
      .get("/api/users/2/orders?page=1&page_size=10")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Orders fetched successfully",
      data: {
        items: [
          {
            id: 11,
            user_id: 2,
            customer_name: "Tran Thi B",
            total_amount: "250000.00",
            status: "PREPARING",
            delivery_address: "45 Le Loi St",
            created_at: "2026-05-22T01:00:00.000Z",
            updated_at: "2026-05-22T01:00:00.000Z",
          },
        ],
        page: 1,
        page_size: 10,
        total: 1,
      },
    });
    expect(executeQuery).toHaveBeenNthCalledWith(1, "SELECT id FROM users WHERE id = ? LIMIT 1", [2]);
  });

  test("allows customer role to list a specific user's orders", async () => {
    executeQuery
      .mockResolvedValueOnce([{ id: 2 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app)
      .get("/api/users/2/orders")
      .set("Authorization", `Bearer ${buildToken(ROLES.CUSTOMER)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Orders fetched successfully",
      data: {
        items: [],
        page: 1,
        page_size: 20,
        total: 0,
      },
    });
  });

  test("returns 404 when listing orders for a missing user", async () => {
    executeQuery.mockResolvedValueOnce([]);

    const response = await request(app)
      .get("/api/users/999/orders")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("User not found");
  });

  test("returns order details with customer and product names", async () => {
    executeQuery
      .mockResolvedValueOnce([
        {
          id: 42,
          user_id: 2,
          customer_name: "Tran Thi B",
          total_amount: "100000.00",
          status: "PENDING",
          delivery_address: "45 Le Loi St",
          created_at: "2026-05-22T01:00:00.000Z",
          updated_at: "2026-05-22T01:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          product_id: 7,
          product_name: "Pho Bo",
          quantity: 2,
          price_at_order: "50000.00",
        },
      ]);

    const response = await request(app)
      .get("/api/orders/42")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Order fetched successfully",
      data: {
        id: 42,
        user_id: 2,
        customer_name: "Tran Thi B",
        total_amount: "100000.00",
        status: "PENDING",
        delivery_address: "45 Le Loi St",
        created_at: "2026-05-22T01:00:00.000Z",
        updated_at: "2026-05-22T01:00:00.000Z",
        items: [
          {
            product_id: 7,
            product_name: "Pho Bo",
            quantity: 2,
            price_at_order: "50000.00",
          },
        ],
      },
    });
  });
});
