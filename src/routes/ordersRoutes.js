const express = require("express");
const {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/ordersController");
const { ROLES } = require("../constants/roles");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} = require("../validators/orderValidator");

const ordersRouter = express.Router();

ordersRouter.post(
  "/orders",
  authenticate,
  authorize(ROLES.CUSTOMER),
  validate({ body: createOrderSchema }),
  asyncHandler(createOrder)
);
ordersRouter.get(
  "/orders",
  authenticate,
  authorize(ROLES.STAFF),
  validate({ query: listOrdersQuerySchema }),
  asyncHandler(listOrders)
);
ordersRouter.get(
  "/orders/:id",
  authenticate,
  validate({ params: orderIdParamSchema }),
  asyncHandler(getOrderById)
);
ordersRouter.put(
  "/orders/:id/status",
  authenticate,
  authorize(ROLES.STAFF),
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  asyncHandler(updateOrderStatus)
);

module.exports = { ordersRouter };
