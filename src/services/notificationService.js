const { ROLES } = require("../constants/roles");

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
    // Explicit sequential writes keep error handling deterministic.
    // Notification count is expected to be small for staff role.
    await createNotification(executor, userId, title, message);
  }
}

module.exports = {
  createNotification,
  notifyStaffNewOrder,
};
