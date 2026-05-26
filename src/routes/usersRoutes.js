const express = require("express");
const { createStaff, listStaff, updateUser } = require("../controllers/usersController");
const { listOrdersByUserId } = require("../controllers/ordersController");
const { ROLES } = require("../constants/roles");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { listOrdersQuerySchema } = require("../validators/orderValidator");
const {
  createStaffSchema,
  updateUserSchema,
  userIdParamSchema,
} = require("../validators/userValidator");

const usersRouter = express.Router();

usersRouter.get(
  "/users",
  authenticate,
  authorize(ROLES.ADMIN),
  asyncHandler(listStaff)
);
usersRouter.post(
  "/users/staff",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createStaffSchema }),
  asyncHandler(createStaff)
);
usersRouter.put(
  "/users/:id",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  asyncHandler(updateUser)
);
usersRouter.get(
  "/users/:id/orders",
  authenticate,
  validate({ params: userIdParamSchema, query: listOrdersQuerySchema }),
  asyncHandler(listOrdersByUserId)
);

module.exports = { usersRouter };
