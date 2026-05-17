const { AppError } = require("../utils/appError");

function validate({ body, params, query }) {
  return function validationMiddleware(req, _res, next) {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        Object.defineProperty(req, "query", {
          value: query.parse(req.query),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      return next();
    } catch (error) {
      return next(new AppError("Validation failed", 400, error.issues || null));
    }
  };
}

module.exports = { validate };
