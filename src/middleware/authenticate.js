const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { AppError } = require("../utils/appError");

function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication token is required", 401));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.user_id,
      role: payload.role,
    };
    return next();
  } catch (_error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = { authenticate };
