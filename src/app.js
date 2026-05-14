const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const { notFoundHandler } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { apiRouter } = require("./routes");

const app = express();
const uploadsDir = path.join(process.cwd(), "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(uploadsDir));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Service is healthy",
    data: {},
  });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
