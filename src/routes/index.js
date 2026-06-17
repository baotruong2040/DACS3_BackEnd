const express = require("express");
const { authRouter } = require("./authRoutes");
const { catalogRouter } = require("./catalogRoutes");
const { ordersRouter } = require("./ordersRoutes");
const { notificationsRouter } = require("./notificationsRoutes");
const { usersRouter } = require("./usersRoutes");
const { reportsRouter } = require("./reportsRoutes");
const { favoritesRouter } = require("./favoritesRoutes");
const { reviewsRouter } = require("./reviewsRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use(catalogRouter);
apiRouter.use(ordersRouter);
apiRouter.use(notificationsRouter);
apiRouter.use(usersRouter);
apiRouter.use(reportsRouter);
apiRouter.use("/favorites", favoritesRouter);
apiRouter.use("/reviews", reviewsRouter);

module.exports = { apiRouter };
