const { ROLES } = require("../constants/roles");
const { fireAndForgetPush } = require("./fcmService");

async function createNotification(executor, userId, title, message) {
  const result = await runExecute(
    executor,
    `
      INSERT INTO notifications (user_id, title, message, is_read)
      VALUES (?, ?, ?, FALSE)
    `,
    [userId, title, message]
  );
  return result.insertId;
}

async function getUserTokensByRole(executor, role) {
  const rows = await runExecute(
    executor,
    `
      SELECT fcm_token
      FROM users
      WHERE role = ? AND fcm_token IS NOT NULL
    `,
    [role]
  );
  return rows.map((row) => row.fcm_token);
}

async function getUserIdsByRole(executor, role) {
  const rows = await runExecute(
    executor,
    `
      SELECT id
      FROM users
      WHERE role = ?
    `,
    [role]
  );
  return rows.map((row) => row.id);
}

async function runExecute(executor, sql, params) {
  const output = await executor.execute(sql, params);
  if (Array.isArray(output)) {
    return output[0];
  }
  return output;
}

async function notifyStaffNewOrder(executor, orderId) {
  const staffIds = await getUserIdsByRole(executor, ROLES.STAFF);
  const title = "New order received";
  const message = `Order #${orderId} has been placed and is pending.`;

  for (const userId of staffIds) {
    await createNotification(executor, userId, title, message);
  }

  const staffTokens = await getUserTokensByRole(executor, ROLES.STAFF);
  if (staffTokens.length > 0) {
    fireAndForgetPush(staffTokens, title, message, {
      order_id: String(orderId),
    });
  }
}

module.exports = {
  createNotification,
  notifyStaffNewOrder,
};
