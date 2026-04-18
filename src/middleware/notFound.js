const { errorResponse } = require("../utils/response");

function notFoundHandler(_req, res) {
  return errorResponse(res, "Route not found", 404);
}

module.exports = { notFoundHandler };
