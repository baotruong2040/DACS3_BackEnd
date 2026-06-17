const express = require("express");
const {
  addFavorite,
  removeFavorite,
  listFavorites,
} = require("../controllers/favoritesController");
const { authenticate } = require("../middleware/authenticate");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  addFavoriteSchema,
  productIdParamSchema,
} = require("../validators/favoriteValidator");

const favoritesRouter = express.Router();

favoritesRouter.use(authenticate);

favoritesRouter.get("/", asyncHandler(listFavorites));

favoritesRouter.post(
  "/",
  validate({ body: addFavoriteSchema }),
  asyncHandler(addFavorite)
);

favoritesRouter.delete(
  "/:product_id",
  validate({ params: productIdParamSchema }),
  asyncHandler(removeFavorite)
);

module.exports = { favoritesRouter };
