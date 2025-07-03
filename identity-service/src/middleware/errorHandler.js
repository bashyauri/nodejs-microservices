const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    meessage: err.meessage || "Internal server error",
  });
};

module.exports = errorHandler;
