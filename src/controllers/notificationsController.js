const { executeQuery } = require("../db/query");
const { AppError } = require("../utils/appError");
const { successResponse } = require("../utils/response");

async function listNotifications(req, res) {
  const rows = await executeQuery(
    `
      SELECT id, title, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [req.user.id]
  );

  return successResponse(res, "Notifications fetched successfully", rows);
}

async function markNotificationRead(req, res) {
  const notificationId = req.params.id;

  const rows = await executeQuery(
    `
      SELECT id
      FROM notifications
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [notificationId, req.user.id]
  );
  if (rows.length === 0) {
    throw new AppError("Notification not found", 404);
  }

  await executeQuery(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ? AND user_id = ?
    `,
    [notificationId, req.user.id]
  );

  return successResponse(res, "Notification marked as read", {
    notification_id: Number(notificationId),
    is_read: true,
  });
}

module.exports = {
  listNotifications,
  markNotificationRead,
};
