const { executeQuery } = require("../db/query");
const { ROLES } = require("../constants/roles");
const { AppError } = require("../utils/appError");
const { successResponse } = require("../utils/response");
const {
  hashPassword,
  verifyPassword,
  signAccessToken,
} = require("../services/authService");

async function register(req, res) {
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
    [username, passwordHash, full_name, email, phone, address || null, ROLES.CUSTOMER]
  );

  return successResponse(
    res,
    "Customer registered successfully",
    {
      user_id: result.insertId,
      role: ROLES.CUSTOMER,
    },
    201
  );
}

async function login(req, res) {
  const { username, password } = req.body;

  const users = await executeQuery(
    `
      SELECT id, password, role
      FROM users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  if (users.length === 0) {
    throw new AppError("Invalid credentials", 401);
  }

  const user = users[0];
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signAccessToken(user.id, user.role);

  return successResponse(res, "Login successful", {
    token,
    user_id: user.id,
    role: user.role,
  });
}

module.exports = {
  register,
  login,
};
