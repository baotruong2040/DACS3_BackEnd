const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { AppError } = require("../utils/appError");

const uploadsRoot = path.join(process.cwd(), "uploads");
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createImageUploadMiddleware(subfolder) {
  const targetDir = path.join(uploadsRoot, subfolder);
  ensureDirectory(targetDir);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      cb(null, fileName);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
        return cb(new AppError("Only image files are allowed", 400));
      }

      return cb(null, true);
    },
  });

  return function imageUploadMiddleware(req, _res, next) {
    upload.single("image")(req, _res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return next(new AppError("Image must be smaller than 5MB", 400));
          }

          return next(new AppError(error.message, 400));
        }

        return next(error);
      }

      if (req.file) {
        req.uploadedImagePath = `/uploads/${subfolder}/${req.file.filename}`;
      }

      return next();
    });
  };
}

module.exports = {
  createImageUploadMiddleware,
};
