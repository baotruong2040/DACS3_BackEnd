const { app } = require("./app");
const { env } = require("./config/env");
const { closePool, pool } = require("./db/pool");
const { initializeFirebase } = require("./services/fcmService");
const { logger } = require("./utils/logger");

let server;

async function startServer() {
  initializeFirebase();
  await pool.query("SELECT 1");
  server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  if (server) {
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    return;
  }
  await closePool();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

startServer().catch(async (error) => {
  logger.error("Failed to start server", { message: error.message });
  await closePool();
  process.exit(1);
});
