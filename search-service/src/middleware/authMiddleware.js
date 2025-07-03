const logger = require("../utils/logger");
const authenticateRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.error("Authentication failed: User ID not provided");
    return res.status(401).json({
      success: false,
      message: "Authentication failed: Please login to continue",
    });
  }
  req.user = { userId };
  next();
};

module.exports = authenticateRequest;
