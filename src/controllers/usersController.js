const { executeQuery } = require("../db/query");
const { ROLES } = require("../constants/roles");
const { AppError } = require("../utils/appError");
const { successResponse } = require("../utils/response");
const { hashPassword } = require("../services/authService");

async function listStaff(_req, res) {
  const rows = await executeQuery(
    `
      SELECT id, username, full_name, email, phone, address, role, created_at
      FROM users
      ORDER BY id DESC
    `
  );

  return successResponse(res, "Staff users fetched successfully", rows);
}

async function createStaff(req, res) {
  const { username, password, full_name, email, phone, address } = req.body;

  const existingUsers = await executeQuery(
    `
      SELECT id
      FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
    `,
    [username, email]
  );
  if (existingUsers.length > 0) {
    throw new AppError("Username or email already exists", 409);
  }

  const passwordHash = await hashPassword(password);
  const result = await executeQuery(
    `
      INSERT INTO users (username, password, full_name, email, phone, address, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [username, passwordHash, full_name, email, phone, address || null, ROLES.STAFF]
  );

  return successResponse(
    res,
    "Staff account created successfully",
    {
      user_id: result.insertId,
      role: ROLES.STAFF,
    },
    201
  );
}

async function updateUser(req, res) {
  const userId = req.params.id;
  const payload = req.body;

  const users = await executeQuery("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  if (users.length === 0) {
    throw new AppError("User not found", 404);
  }

  const fields = Object.keys(payload);
  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = [...fields.map((field) => payload[field]), userId];

  await executeQuery(`UPDATE users SET ${setClause} WHERE id = ?`, params);

  return successResponse(res, "User updated successfully", {
    user_id: Number(userId),
  });
}

async function updateFcmToken(req, res) {
  const userId = req.user.id;
  const { fcm_token } = req.body;

  await executeQuery("UPDATE users SET fcm_token = ? WHERE id = ?", [fcm_token, userId]);

  return successResponse(res, "FCM token updated successfully");
}

module.exports = {
  listStaff,
  createStaff,
  updateUser,
  updateFcmToken,
};
