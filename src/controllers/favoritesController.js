const { executeQuery } = require("../db/query");
const { AppError } = require("../utils/appError");
const { successResponse } = require("../utils/response");

async function addFavorite(req, res) {
  const userId = req.user.id;
  const { product_id } = req.body;

  // Check if product exists
  const products = await executeQuery(
    "SELECT id FROM products WHERE id = ? AND is_available = TRUE LIMIT 1",
    [product_id]
  );

  if (products.length === 0) {
    throw new AppError("Product not found or unavailable", 404);
  }

  // Add to favorites if not already favorited
  // We use INSERT IGNORE so if it's already favorited, no error is thrown
  await executeQuery(
    `
      INSERT IGNORE INTO favorite_products (user_id, product_id)
      VALUES (?, ?)
    `,
    [userId, product_id]
  );

  return successResponse(res, "Product added to favorites successfully", null, 201);
}

async function removeFavorite(req, res) {
  const userId = req.user.id;
  const { product_id } = req.params;

  const result = await executeQuery(
    "DELETE FROM favorite_products WHERE user_id = ? AND product_id = ?",
    [userId, product_id]
  );

  if (result.affectedRows === 0) {
    throw new AppError("Favorite not found", 404);
  }

  return successResponse(res, "Product removed from favorites successfully");
}

async function listFavorites(req, res) {
  const userId = req.user.id;

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
        p.average_rating,
        p.total_reviews,
        c.name AS category_name,
        fp.created_at AS favorited_at
      FROM favorite_products fp
      INNER JOIN products p ON p.id = fp.product_id
      INNER JOIN categories c ON c.id = p.category_id
      WHERE fp.user_id = ? AND p.is_available = TRUE
      ORDER BY fp.created_at DESC
    `,
    [userId]
  );

  return successResponse(res, "Favorites fetched successfully", products);
}

module.exports = {
  addFavorite,
  removeFavorite,
  listFavorites,
};
