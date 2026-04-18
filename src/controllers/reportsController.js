const { executeQuery } = require("../db/query");
const { ORDER_STATUS } = require("../constants/orderStatus");
const { successResponse } = require("../utils/response");

function getGroupByExpr(period) {
  if (period === "daily") return "DATE(o.created_at)";
  if (period === "weekly") return "YEARWEEK(o.created_at, 1)";
  return "DATE_FORMAT(o.created_at, '%Y-%m')";
}

async function getRevenueReport(req, res) {
  const { period, from, to } = req.query;
  const groupByExpr = getGroupByExpr(period);

  const rows = await executeQuery(
    `
      SELECT
        ${groupByExpr} AS bucket,
        SUM(o.total_amount) AS revenue,
        COUNT(*) AS order_count
      FROM orders o
      WHERE DATE(o.created_at) BETWEEN ? AND ?
        AND o.status <> ?
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    [from, to, ORDER_STATUS.CANCELLED]
  );

  return successResponse(res, "Revenue report fetched successfully", {
    period,
    from,
    to,
    items: rows,
  });
}

async function getTopProductsReport(req, res) {
  const { from, to, limit } = req.query;

  const rows = await executeQuery(
    `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(od.quantity) AS total_quantity,
        SUM(od.quantity * od.price_at_order) AS total_revenue
      FROM order_details od
      INNER JOIN orders o ON o.id = od.order_id
      INNER JOIN products p ON p.id = od.product_id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
        AND o.status <> ?
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT ?
    `,
    [from, to, ORDER_STATUS.CANCELLED, Number(limit)]
  );

  return successResponse(res, "Top products report fetched successfully", {
    from,
    to,
    limit: Number(limit),
    items: rows,
  });
}

module.exports = {
  getRevenueReport,
  getTopProductsReport,
};
