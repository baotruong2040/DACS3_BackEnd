const { ORDER_STATUS, isValidStatusTransition } = require("../constants/orderStatus");
const { ROLES } = require("../constants/roles");
const { executeQuery, withTransaction } = require("../db/query");
const { createNotification, notifyStaffNewOrder } = require("../services/notificationService");
const { fireAndForgetPush } = require("../services/fcmService");
const { AppError } = require("../utils/appError");
const { successResponse } = require("../utils/response");

function normalizeItems(items) {
  const aggregated = new Map();
  for (const item of items) {
    const key = Number(item.product_id);
    const existing = aggregated.get(key) || 0;
    aggregated.set(key, existing + Number(item.quantity));
  }
  return Array.from(aggregated, ([product_id, quantity]) => ({ product_id, quantity }));
}

async function createOrder(req, res) {
  const userId = req.user.id;
  const { delivery_address, customer_phone = null, items } = req.body;
  const normalizedItems = normalizeItems(items);
  const productIds = normalizedItems.map((item) => item.product_id);
  const placeholders = productIds.map(() => "?").join(",");

  const products = await executeQuery(
    `
      SELECT id, price, is_available
      FROM products
      WHERE id IN (${placeholders})
    `,
    productIds
  );

  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const item of normalizedItems) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new AppError(`Product ${item.product_id} not found`, 404);
    }
    if (!product.is_available) {
      throw new AppError(`Product ${item.product_id} is unavailable`, 400);
    }
  }

  const totalAmount = normalizedItems.reduce((sum, item) => {
    const product = productMap.get(item.product_id);
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const orderId = await withTransaction(async (connection) => {
    const [orderResult] = await connection.execute(
      `
        INSERT INTO orders (user_id, total_amount, status, delivery_address, customer_phone)
        VALUES (?, ?, ?, ?, ?)
      `,
      [userId, totalAmount, ORDER_STATUS.PENDING, delivery_address, customer_phone]
    );

    const createdOrderId = orderResult.insertId;

    for (const item of normalizedItems) {
      const product = productMap.get(item.product_id);
      await connection.execute(
        `
          INSERT INTO order_details (order_id, product_id, quantity, price_at_order)
          VALUES (?, ?, ?, ?)
        `,
        [createdOrderId, item.product_id, item.quantity, product.price]
      );
    }

    await notifyStaffNewOrder(connection, createdOrderId);
    return createdOrderId;
  });

  const [userRows] = await executeQuery("SELECT fcm_token FROM users WHERE id = ?", [userId]);
  if (userRows && userRows.fcm_token) {
    fireAndForgetPush(
      [userRows.fcm_token],
      "Order placed successfully",
      `Your order #${orderId} has been placed and is waiting for processing`,
      {
        order_id: String(orderId),
        status: ORDER_STATUS.PENDING,
      }
    );
  }

  return successResponse(
    res,
    "Order created successfully",
    {
      order_id: orderId,
      total_amount: totalAmount,
      status: ORDER_STATUS.PENDING,
    },
    201
  );
}

async function listOrders(req, res) {
  return listOrdersByFilter(req, res);
}

async function listOrdersByUserId(req, res) {
  const userId = req.params.id;

  const users = await executeQuery("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  if (users.length === 0) {
    throw new AppError("User not found", 404);
  }

  return listOrdersByFilter(req, res, userId);
}

async function listOrdersByFilter(req, res, userId = null) {
  const { status, page, page_size } = req.query;
  const offset = (page - 1) * page_size;
  const conditions = [];
  const params = [];

  if (userId !== null) {
    conditions.push("o.user_id = ?");
    params.push(userId);
  }

  if (status) {
    conditions.push("o.status = ?");
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await executeQuery(
    `
      SELECT
        o.id,
        o.user_id,
        u.full_name AS customer_name,
        o.total_amount,
        o.status,
        o.delivery_address,
        o.customer_phone,
        o.created_at,
        o.updated_at
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, page_size, offset]
  );

  const totalRows = await executeQuery(
    `
      SELECT COUNT(*) AS total
      FROM orders o
      ${whereClause}
    `,
    params
  );

  return successResponse(res, "Orders fetched successfully", {
    items: rows,
    page,
    page_size,
    total: totalRows[0].total,
  });
}

async function getOrderById(req, res) {
  const orderId = req.params.id;
  const orderRows = await executeQuery(
    `
      SELECT
        o.id,
        o.user_id,
        u.full_name AS customer_name,
        o.total_amount,
        o.status,
        o.delivery_address,
        o.customer_phone,
        o.created_at,
        o.updated_at
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
      LIMIT 1
    `,
    [orderId]
  );

  if (orderRows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = orderRows[0];
  if (req.user.role === ROLES.CUSTOMER && req.user.id !== order.user_id) {
    throw new AppError("Forbidden: cannot access another user's order", 403);
  }

  const details = await executeQuery(
    `
      SELECT
        od.product_id,
        p.name AS product_name,
        od.quantity,
        od.price_at_order,
        p.image_url
      FROM order_details od
      INNER JOIN products p ON p.id = od.product_id
      WHERE od.order_id = ?
      ORDER BY od.id ASC
    `,
    [orderId]
  );

  const items = details.map((item) => ({
    ...item,
    price_at_order: Number(item.price_at_order),
    subtotal: Number(item.quantity) * Number(item.price_at_order),
  }));

  return successResponse(res, "Order fetched successfully", {
    ...order,
    items,
  });
}

async function updateOrderStatus(req, res) {
  const orderId = req.params.id;
  const { status: nextStatus } = req.body;

  const rows = await executeQuery(
    `
      SELECT o.id, o.user_id, o.status, u.fcm_token
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
      LIMIT 1
    `,
    [orderId]
  );
  if (rows.length === 0) {
    throw new AppError("Order not found", 404);
  }

  const order = rows[0];
  if (!isValidStatusTransition(order.status, nextStatus)) {
    throw new AppError(
      `Invalid order status transition: ${order.status} -> ${nextStatus}`,
      422
    );
  }

  await executeQuery(
    `
      UPDATE orders
      SET status = ?
      WHERE id = ?
    `,
    [nextStatus, orderId]
  );

  await createNotification(
    { execute: (...args) => executeQuery(...args) },
    order.user_id,
    "Order status updated",
    `Order #${orderId} is now ${nextStatus}.`
  );

  if (order.fcm_token) {
    fireAndForgetPush(
      [order.fcm_token],
      "Order status updated",
      `Order #${orderId} is now ${nextStatus}`,
      {
        order_id: String(orderId),
        status: nextStatus,
      }
    );
  }

  return successResponse(res, "Order status updated successfully", {
    order_id: Number(orderId),
    new_status: nextStatus,
  });
}

module.exports = {
  createOrder,
  listOrders,
  listOrdersByUserId,
  getOrderById,
  updateOrderStatus,
};
