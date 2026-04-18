const { env } = require("../config/env");
const { errorResponse } = require("../utils/response");
const { logger } = require("../utils/logger");

function errorHandler(error, _req, res, _next) {
  if (error.isOperational) {
    return errorResponse(
      res,
      error.message,
      error.statusCode || 500,
      error.details || null
    );
  }

  logger.error("Unhandled error", {
    message: error.message,
    stack: error.stack,
  });

  const message =
    env.NODE_ENV === "production"
      ? "Internal server error"
      : "Internal server error";

  return errorResponse(res, message, 500);
}

module.exports = { errorHandler };
