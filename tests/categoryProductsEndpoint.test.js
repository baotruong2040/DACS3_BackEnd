const express = require("express");
const request = require("supertest");

jest.mock("../src/db/query", () => ({
  executeQuery: jest.fn(),
}));

const { executeQuery } = require("../src/db/query");
const { catalogRouter } = require("../src/routes/catalogRoutes");
const { errorHandler } = require("../src/middleware/errorHandler");

describe("GET /api/categories/:id/products", () => {
  const app = express();
  app.use(express.json());
  app.use("/api", catalogRouter);
  app.use(errorHandler);

  beforeEach(() => {
    executeQuery.mockReset();
  });

  test("returns paginated available products by category", async () => {
    executeQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([
        {
          id: 2,
          name: "Product A",
          description: "Test",
          price: "10000.00",
          image_url: null,
          is_available: 1,
          category_id: 1,
          category_name: "Category 1",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app).get(
      "/api/categories/1/products?page=2&page_size=1"
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Category products fetched successfully",
      data: {
        products: [
          {
            id: 2,
            name: "Product A",
            description: "Test",
            price: "10000.00",
            image_url: null,
            is_available: 1,
            category_id: 1,
            category_name: "Category 1",
          },
        ],
        page: 2,
        page_size: 1,
        total: 1,
      },
    });
  });

  test("returns 404 when category does not exist", async () => {
    executeQuery.mockResolvedValueOnce([]);

    const response = await request(app).get("/api/categories/999/products");

    expect(response.status).toBe(404);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Category not found");
  });

  test("returns empty products list for existing category with no available products", async () => {
    executeQuery
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app).get("/api/categories/1/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "success",
      message: "Category products fetched successfully",
      data: {
        products: [],
        page: 1,
        page_size: 20,
        total: 0,
      },
    });
  });

  test("returns 400 for invalid params/query", async () => {
    const response = await request(app).get(
      "/api/categories/abc/products?page=0&page_size=101"
    );

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Validation failed");
  });
});
