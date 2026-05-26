const { executeQuery } = require("../db/query");
const { AppError } = require("../utils/appError");
const { buildPublicUrl } = require("../utils/publicUrl");
const { successResponse } = require("../utils/response");

async function listProducts(_req, res) {
  const rows = await executeQuery(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.is_available = TRUE
      ORDER BY p.id DESC
    `
  );

  return successResponse(res, "Products fetched successfully", rows);
}

async function getProductById(req, res) {
  const productId = req.params.id;

  const rows = await executeQuery(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.id = ? AND p.is_available = TRUE
      LIMIT 1
    `,
    [productId]
  );

  if (rows.length === 0) {
    throw new AppError("Product not found", 404);
  }

  return successResponse(res, "Product fetched successfully", rows[0]);
}

async function createProduct(req, res) {
  const {
    name,
    description = null,
    price,
    image_url = null,
    category_id,
    is_available = true,
  } = req.body;
  const storedImageUrl = req.uploadedImagePath
    ? buildPublicUrl(req, req.uploadedImagePath)
    : image_url;

  const categories = await executeQuery(
    "SELECT id FROM categories WHERE id = ? LIMIT 1",
    [category_id]
  );
  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }

  const result = await executeQuery(
    `
      INSERT INTO products (name, description, price, image_url, category_id, is_available)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [name, description, price, storedImageUrl, category_id, is_available]
  );

  return successResponse(
    res,
    "Product created successfully",
    { product_id: result.insertId },
    201
  );
}

async function updateProduct(req, res) {
  const productId = req.params.id;
  const payload = req.body;
  const updatePayload = { ...payload };

  const products = await executeQuery(
    "SELECT id FROM products WHERE id = ? LIMIT 1",
    [productId]
  );
  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  if (payload.category_id) {
    const categories = await executeQuery(
      "SELECT id FROM categories WHERE id = ? LIMIT 1",
      [payload.category_id]
    );
    if (categories.length === 0) {
      throw new AppError("Category not found", 404);
    }
  }

  if (req.uploadedImagePath) {
   updatePayload.image_url = buildPublicUrl(req, req.uploadedImagePath);
  }

  const fields = Object.keys(updatePayload);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = [...fields.map((field) => updatePayload[field]), productId];

  await executeQuery(`UPDATE products SET ${setClause} WHERE id = ?`, params);

  return successResponse(res, "Product updated successfully", { product_id: productId });
}

async function listCategories(_req, res) {
  const rows = await executeQuery(
    `
      SELECT id, name, description, image_url
      FROM categories
      ORDER BY id DESC
    `
  );

  return successResponse(res, "Categories fetched successfully", rows);
}

async function listProductsByCategory(req, res) {
  const categoryId = req.params.id;
  const { page, page_size } = req.query;
  const offset = (page - 1) * page_size;

  const categories = await executeQuery(
    "SELECT id FROM categories WHERE id = ? LIMIT 1",
    [categoryId]
  );
  if (categories.length === 0) {
    throw new AppError("Category not found", 404);
  }

  const products = await executeQuery(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE p.category_id = ? AND p.is_available = TRUE
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `,
    [categoryId, page_size, offset]
  );

  const totalRows = await executeQuery(
    `
      SELECT COUNT(*) AS total
      FROM products
      WHERE category_id = ? AND is_available = TRUE
    `,
    [categoryId]
  );

  return successResponse(res, "Category products fetched successfully", {
    products,
    page,
    page_size,
    total: totalRows[0].total,
  });
}

async function searchProducts(req, res) {
  const { q, category_ids, sort_by, sort_order, page, page_size } = req.query;
  const offset = (page - 1) * page_size;

  const whereConditions = ["p.is_available = TRUE"];
  const params = [];

  if (q) {
    whereConditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm);
  }

  if (category_ids.length > 0) {
    const placeholders = category_ids.map(() => "?").join(",");
    whereConditions.push(`p.category_id IN (${placeholders})`);
    params.push(...category_ids);
  }

  const whereClause = whereConditions.join(" AND ");
  const orderBy = sort_by === "name" ? "p.name" : sort_by === "price" ? "p.price" : "p.id";
  const orderDirection = sort_order === "asc" ? "ASC" : "DESC";

  const products = await executeQuery(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.is_available,
        p.category_id,
        c.name AS category_name
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `,
    [...params, page_size, offset]
  );

  const countResult = await executeQuery(
    `
      SELECT COUNT(*) AS total
      FROM products p
      WHERE ${whereClause}
    `,
    params
  );

  return successResponse(res, "Products search results fetched successfully", {
    products,
    page,
    page_size,
    total: countResult[0].total,
  });
}

async function createCategory(req, res) {
  const { name, description = null, image_url = null } = req.body;
  const storedImageUrl = req.uploadedImagePath
    ? buildPublicUrl(req, req.uploadedImagePath)
    : image_url;

  const result = await executeQuery(
    `
      INSERT INTO categories (name, description, image_url)
      VALUES (?, ?, ?)
    `,
    [name, description, storedImageUrl]
  );

  return successResponse(
    res,
    "Category created successfully",
    { category_id: result.insertId },
    201
  );
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  listCategories,
  listProductsByCategory,
  searchProducts,
  createCategory,
};
