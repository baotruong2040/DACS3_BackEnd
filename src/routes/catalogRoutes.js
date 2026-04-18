const express = require("express");
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  listCategories,
  createCategory,
} = require("../controllers/catalogController");
const { ROLES } = require("../constants/roles");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  createCategorySchema,
  createProductSchema,
  idParamSchema,
  updateProductSchema,
} = require("../validators/catalogValidator");

const catalogRouter = express.Router();

catalogRouter.get("/products", asyncHandler(listProducts));
catalogRouter.get(
  "/products/:id",
  validate({ params: idParamSchema }),
  asyncHandler(getProductById)
);
catalogRouter.post(
  "/products",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createProductSchema }),
  asyncHandler(createProduct)
);
catalogRouter.put(
  "/products/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(updateProduct)
);

catalogRouter.get("/categories", asyncHandler(listCategories));
catalogRouter.post(
  "/categories",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createCategorySchema }),
  asyncHandler(createCategory)
);

module.exports = { catalogRouter };
