const express = require("express");
const {
  createReview,
  getProductReviews,
} = require("../controllers/reviewsController");
const { authenticate } = require("../middleware/authenticate");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  createReviewSchema,
  productIdParamSchema,
  listReviewsQuerySchema,
} = require("../validators/reviewValidator");

const reviewsRouter = express.Router();

reviewsRouter.post(
  "/",
  authenticate,
  validate({ body: createReviewSchema }),
  asyncHandler(createReview)
);

reviewsRouter.get(
  "/products/:product_id",
  validate({ params: productIdParamSchema, query: listReviewsQuerySchema }),
  asyncHandler(getProductReviews)
);

module.exports = { reviewsRouter };
