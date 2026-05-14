/* global beforeAll, afterAll */

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const { app } = require("../src/app");
const { buildPublicUrl } = require("../src/utils/publicUrl");

describe("image serving", () => {
  const uploadsDir = path.join(process.cwd(), "uploads", "products");
  const fileName = "test-image.txt";
  const filePath = path.join(uploadsDir, fileName);

  beforeAll(() => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(filePath, "image-content");
  });

  afterAll(() => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  test("serves uploaded files from /uploads", async () => {
    const response = await request(app).get(`/uploads/products/${fileName}`);

    expect(response.status).toBe(200);
    expect(response.text).toBe("image-content");
  });

  test("builds absolute https url when PUBLIC_BASE_URL is set on request", () => {
    const req = {
      protocol: "https",
      get: (header) => (header === "host" ? "api.example.com" : ""),
    };

    expect(buildPublicUrl(req, `/uploads/products/${fileName}`)).toBe(
      `https://api.example.com/uploads/products/${fileName}`
    );
  });
});
