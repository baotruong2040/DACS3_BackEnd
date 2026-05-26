const express = require("express");
const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  listCategories,
  listProductsByCategory,
  searchProducts,
  createCategory,
} = require("../controllers/catalogController");
const { ROLES } = require("../constants/roles");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { createImageUploadMiddleware } = require("../middleware/uploadImage");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  createCategorySchema,
  createProductSchema,
  idParamSchema,
  listCategoryProductsQuerySchema,
  searchProductsQuerySchema,
  updateProductSchema,
} = require("../validators/catalogValidator");

const catalogRouter = express.Router();
const uploadProductImage = createImageUploadMiddleware("products");
const uploadCategoryImage = createImageUploadMiddleware("categories");

catalogRouter.get("/products", asyncHandler(listProducts));
catalogRouter.get(
  "/products/search",
  validate({ query: searchProductsQuerySchema }),
  asyncHandler(searchProducts)
);
catalogRouter.get(
  "/products/:id",
  validate({ params: idParamSchema }),
  asyncHandler(getProductById)
);
catalogRouter.post(
  "/products",
  authenticate,
  authorize(ROLES.ADMIN),
  uploadProductImage,
  validate({ body: createProductSchema }),
  asyncHandler(createProduct)
);
catalogRouter.put(
  "/products/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  uploadProductImage,
  validate({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(updateProduct)
);

catalogRouter.get("/categories", asyncHandler(listCategories));
catalogRouter.get(
  "/categories/:id/products",
  validate({ params: idParamSchema, query: listCategoryProductsQuerySchema }),
  asyncHandler(listProductsByCategory)
);
catalogRouter.post(
  "/categories",
  authenticate,
  authorize(ROLES.ADMIN),
  uploadCategoryImage,
  validate({ body: createCategorySchema }),
  asyncHandler(createCategory)
);

module.exports = { catalogRouter };
