const { hasMinimumRole } = require("../constants/roles");
const { AppError } = require("../utils/appError");

function authorize(minRole) {
  return function authorizationMiddleware(req, _res, next) {
    if (!req.user) {
      return next(new AppError("Authentication is required", 401));
    }

    if (!hasMinimumRole(req.user.role, minRole)) {
      return next(new AppError("Forbidden: insufficient role", 403));
    }

    return next();
  };
}

module.exports = { authorize };
