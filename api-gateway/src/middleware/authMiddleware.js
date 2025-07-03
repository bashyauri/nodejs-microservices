const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error(`Token validation error: ${err.message}`);
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    req.user = decoded;
    next();
  });
};
module.exports = { validateToken };
