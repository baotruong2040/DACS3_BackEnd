const express = require("express");
const request = require("supertest");

jest.mock("../src/db/query", () => ({
  executeQuery: jest.fn(),
}));

const { executeQuery } = require("../src/db/query");
const { catalogRouter } = require("../src/routes/catalogRoutes");
const { errorHandler } = require("../src/middleware/errorHandler");

describe("GET /api/products/search", () => {
  const app = express();
  app.use(express.json());
  app.use("/api", catalogRouter);
  app.use(errorHandler);

  beforeEach(() => {
    executeQuery.mockReset();
  });

  test("returns search results with text query", async () => {
    executeQuery
      .mockResolvedValueOnce([
        {
          id: 1,
          name: "Phở Bò",
          description: "Traditional beef pho",
          price: "50000.00",
          image_url: null,
          is_available: 1,
          category_id: 1,
          category_name: "Noodle Soups",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app).get("/api/products/search?q=pho");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.products.length).toBe(1);
    expect(response.body.data.products[0].name).toBe("Phở Bò");
    expect(response.body.data.total).toBe(1);
  });

  test("returns filtered results by category_ids", async () => {
    executeQuery
      .mockResolvedValueOnce([
        {
          id: 2,
          name: "Mì Xào",
          description: "Stir-fried noodles",
          price: "40000.00",
          image_url: null,
          is_available: 1,
          category_id: 2,
          category_name: "Noodle Dishes",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app).get("/api/products/search?category_ids=2,3");

    expect(response.status).toBe(200);
    expect(response.body.data.products[0].category_id).toBe(2);
  });

  test("supports sorting by name ascending", async () => {
    executeQuery
      .mockResolvedValueOnce([
        {
          id: 1,
          name: "Bánh Mì",
          description: "Vietnamese sandwich",
          price: "30000.00",
          image_url: null,
          is_available: 1,
          category_id: 3,
          category_name: "Sandwiches",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app).get(
      "/api/products/search?sort_by=name&sort_order=asc"
    );

    expect(response.status).toBe(200);
    expect(response.body.data.products.length).toBe(1);
  });

  test("supports pagination with page and page_size", async () => {
    const mockProducts = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      description: "Test product",
      price: "10000.00",
      image_url: null,
      is_available: 1,
      category_id: 1,
      category_name: "Category 1",
    }));

    executeQuery
      .mockResolvedValueOnce(mockProducts.slice(0, 5))
      .mockResolvedValueOnce([{ total: 25 }]);

    const response = await request(app).get(
      "/api/products/search?page=2&page_size=5"
    );

    expect(response.status).toBe(200);
    expect(response.body.data.page).toBe(2);
    expect(response.body.data.page_size).toBe(5);
    expect(response.body.data.total).toBe(25);
  });

  test("returns empty results when no products match", async () => {
    executeQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app).get("/api/products/search?q=nonexistent");

    expect(response.status).toBe(200);
    expect(response.body.data.products).toEqual([]);
    expect(response.body.data.total).toBe(0);
  });

  test("combines text search with category filter", async () => {
    executeQuery
      .mockResolvedValueOnce([
        {
          id: 1,
          name: "Phở Bò",
          description: "Traditional beef pho",
          price: "50000.00",
          image_url: null,
          is_available: 1,
          category_id: 1,
          category_name: "Noodle Soups",
        },
      ])
      .mockResolvedValueOnce([{ total: 1 }]);

    const response = await request(app).get(
      "/api/products/search?q=pho&category_ids=1"
    );

    expect(response.status).toBe(200);
    expect(response.body.data.products[0].category_id).toBe(1);
  });

  test("returns 400 for invalid page_size (> 100)", async () => {
    const response = await request(app).get(
      "/api/products/search?page_size=101"
    );

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  test("returns 400 for invalid sort_by", async () => {
    const response = await request(app).get(
      "/api/products/search?sort_by=invalid"
    );

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  test("returns 400 for invalid sort_order", async () => {
    const response = await request(app).get(
      "/api/products/search?sort_order=invalid"
    );

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  test("handles comma-separated category_ids correctly", async () => {
    executeQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app).get(
      "/api/products/search?category_ids=1,2,3"
    );

    expect(response.status).toBe(200);
  });

  test("ignores invalid category IDs in category_ids", async () => {
    executeQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app).get(
      "/api/products/search?category_ids=1,abc,2"
    );

    expect(response.status).toBe(200);
  });

  test("defaults to page=1 and page_size=20", async () => {
    executeQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app).get("/api/products/search");

    expect(response.status).toBe(200);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.page_size).toBe(20);
  });
});
