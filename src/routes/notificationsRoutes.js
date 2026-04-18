const express = require("express");
const {
  listNotifications,
  markNotificationRead,
} = require("../controllers/notificationsController");
const { authenticate } = require("../middleware/authenticate");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { notificationIdParamSchema } = require("../validators/notificationValidator");

const notificationsRouter = express.Router();

notificationsRouter.get("/notifications", authenticate, asyncHandler(listNotifications));
notificationsRouter.put(
  "/notifications/:id/read",
  authenticate,
  validate({ params: notificationIdParamSchema }),
  asyncHandler(markNotificationRead)
);

module.exports = { notificationsRouter };
