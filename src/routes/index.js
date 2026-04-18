const express = require("express");
const { authRouter } = require("./authRoutes");
const { catalogRouter } = require("./catalogRoutes");
const { ordersRouter } = require("./ordersRoutes");
const { notificationsRouter } = require("./notificationsRoutes");
const { usersRouter } = require("./usersRoutes");
const { reportsRouter } = require("./reportsRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(catalogRouter);
apiRouter.use(ordersRouter);
apiRouter.use(notificationsRouter);
apiRouter.use(usersRouter);
apiRouter.use(reportsRouter);

module.exports = { apiRouter };
