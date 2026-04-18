function successResponse(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
}

function errorResponse(res, message, statusCode = 500, details = null) {
  const payload = {
    status: "error",
    message,
    data: {},
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse,
};
