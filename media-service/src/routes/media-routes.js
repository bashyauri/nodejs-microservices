const express = require("express");
const multer = require("multer");

const { uploadMedia, getAllMedia } = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error while uploading:", err);
        return res.status(400).json({
          message: "Multer error while uploading:",
          error: err.message,
          stack: err.stack,
        });
      } else if (err) {
        logger.error("Unknown error while uploading:", err);
        return res.status(500).json({
          message: "Unknown error while uploading:",
          error: err.message,
          stack: err.stack,
          success: true,
        });
      }
      if (!req.file) {
        return res.status(400).json({
          message: "No file found",
          success: false,
        });
      }
      next();
    });
  },
  uploadMedia
);
router.get("/all", authenticateRequest, getAllMedia);
module.exports = router;
