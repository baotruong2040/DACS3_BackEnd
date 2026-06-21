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
      WHERE is_deleted = 0
      ORDER BY id DESC
    `
  );

  return successResponse(res, "Staff users fetched successfully", rows);
}

async function createStaff(req, res) {
  const { username, password, full_name, email, phone, address, role = ROLES.STAFF } = req.body;

  const existingUsers = await executeQuery(
    `
      SELECT id
      FROM users
      WHERE (username = ? OR email = ?) AND is_deleted = 0
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
    [username, passwordHash, full_name, email, phone, address || null, role]
  );

  return successResponse(
    res,
    "Staff account created successfully",
    {
      user_id: result.insertId,
      role: role,
    },
    201
  );
}

async function updateUser(req, res) {
  const userId = req.params.id;
  const payload = req.body;

  const users = await executeQuery("SELECT id FROM users WHERE id = ? AND is_deleted = 0 LIMIT 1", [userId]);
  if (users.length === 0) {
    throw new AppError("User not found", 404);
  }

  const fields = Object.keys(payload);
  if (fields.length === 0) {
    return successResponse(res, "No fields to update", { user_id: Number(userId) });
  }

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

  await executeQuery("UPDATE users SET fcm_token = ? WHERE id = ? AND is_deleted = 0", [fcm_token, userId]);

  return successResponse(res, "FCM token updated successfully");
}

async function getMe(req, res) {
  const userId = req.user.id;

  const users = await executeQuery(
    `
      SELECT id, username, full_name, email, phone, address, role, created_at
      FROM users
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
    [userId]
  );

  if (users.length === 0) {
    throw new AppError("User not found", 404);
  }

  return successResponse(res, "User profile fetched successfully", users[0]);
}

async function updateMe(req, res) {
  const userId = req.user.id;
  const payload = req.body;

  const users = await executeQuery("SELECT id FROM users WHERE id = ? AND is_deleted = 0 LIMIT 1", [userId]);
  if (users.length === 0) {
    throw new AppError("User not found", 404);
  }

  if (payload.email) {
    const existingEmail = await executeQuery(
      "SELECT id FROM users WHERE email = ? AND id != ? AND is_deleted = 0 LIMIT 1",
      [payload.email, userId]
    );
    if (existingEmail.length > 0) {
      throw new AppError("Email already exists", 409);
    }
  }

  const fields = Object.keys(payload);
  if (fields.length === 0) {
    return successResponse(res, "No fields to update", { user_id: Number(userId) });
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const params = [...fields.map((field) => payload[field]), userId];

  await executeQuery(`UPDATE users SET ${setClause} WHERE id = ?`, params);

  return successResponse(res, "Profile updated successfully", {
    user_id: Number(userId),
  });
}

async function deleteUser(req, res) {
  const userId = req.params.id;

  const users = await executeQuery("SELECT id FROM users WHERE id = ? AND is_deleted = 0 LIMIT 1", [userId]);
  if (users.length === 0) {
    throw new AppError("User not found", 404);
  }

  await executeQuery(
    `
      UPDATE users 
      SET is_deleted = 1,
          username = CONCAT(username, '_deleted_', UNIX_TIMESTAMP()),
          email = CASE WHEN email IS NOT NULL THEN CONCAT(email, '_deleted_', UNIX_TIMESTAMP()) ELSE NULL END
      WHERE id = ?
    `,
    [userId]
  );

  return successResponse(res, "User soft deleted successfully", {
    user_id: Number(userId),
  });
}

module.exports = {
  listStaff,
  createStaff,
  updateUser,
  updateFcmToken,
  getMe,
  updateMe,
  deleteUser,
};
