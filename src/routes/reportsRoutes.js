const express = require("express");
const { getRevenueReport, getTopProductsReport } = require("../controllers/reportsController");
const { ROLES } = require("../constants/roles");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  revenueReportQuerySchema,
  topProductsQuerySchema,
} = require("../validators/reportValidator");

const reportsRouter = express.Router();

reportsRouter.get(
  "/reports/revenue",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ query: revenueReportQuerySchema }),
  asyncHandler(getRevenueReport)
);
reportsRouter.get(
  "/reports/top-products",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ query: topProductsQuerySchema }),
  asyncHandler(getTopProductsReport)
);

module.exports = { reportsRouter };
