const { executeQuery, withTransaction } = require("../db/query");
const { AppError } = require("../utils/appError");
const { successResponse } = require("../utils/response");
const { ORDER_STATUS } = require("../constants/orderStatus");

async function createReview(req, res) {
  const userId = req.user.id;
  const { product_id, order_id, rating, comment = null } = req.body;

  // Verify the order belongs to the user and is DELIVERED
  const orders = await executeQuery(
    "SELECT id, status FROM orders WHERE id = ? AND user_id = ? LIMIT 1",
    [order_id, userId]
  );

  if (orders.length === 0) {
    throw new AppError("Order not found or does not belong to you", 404);
  }

  if (orders[0].status !== ORDER_STATUS.DELIVERED) {
    throw new AppError("You can only review products from delivered orders", 403);
  }

  // Verify the product is in the order
  const orderDetails = await executeQuery(
    "SELECT id FROM order_details WHERE order_id = ? AND product_id = ? LIMIT 1",
    [order_id, product_id]
  );

  if (orderDetails.length === 0) {
    throw new AppError("Product was not found in this order", 400);
  }

  // Verify the user hasn't already reviewed this product for this order
  const existingReviews = await executeQuery(
    "SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1",
    [userId, product_id, order_id]
  );

  if (existingReviews.length > 0) {
    throw new AppError("You have already reviewed this product for this order", 409);
  }

  await withTransaction(async (connection) => {
    // 1. Insert review
    await connection.execute(
      `
        INSERT INTO reviews (user_id, product_id, order_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `,
      [userId, product_id, order_id, rating, comment]
    );

    // 2. Calculate new average rating and total reviews for the product
    const [statsResult] = await connection.execute(
      `
        SELECT 
          CAST(AVG(rating) AS DECIMAL(3,2)) AS new_average_rating,
          COUNT(*) AS new_total_reviews
        FROM reviews
        WHERE product_id = ?
      `,
      [product_id]
    );

    const { new_average_rating, new_total_reviews } = statsResult[0];

    // 3. Update the product
    await connection.execute(
      `
        UPDATE products 
        SET average_rating = ?, total_reviews = ?
        WHERE id = ?
      `,
      [new_average_rating, new_total_reviews, product_id]
    );
  });

  return successResponse(res, "Review submitted successfully", null, 201);
}

async function getProductReviews(req, res) {
  const { product_id } = req.params;
  const { page, page_size } = req.query;
  const offset = (page - 1) * page_size;

  // Check if product exists
  const products = await executeQuery("SELECT id FROM products WHERE id = ? LIMIT 1", [product_id]);
  if (products.length === 0) {
    throw new AppError("Product not found", 404);
  }

  const reviews = await executeQuery(
    `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.id AS user_id,
        u.full_name AS user_full_name
      FROM reviews r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [product_id, page_size, offset]
  );

  const countResult = await executeQuery(
    "SELECT COUNT(*) AS total FROM reviews WHERE product_id = ?",
    [product_id]
  );

  return successResponse(res, "Reviews fetched successfully", {
    reviews,
    page,
    page_size,
    total: countResult[0].total,
  });
}

module.exports = {
  createReview,
  getProductReviews,
};
