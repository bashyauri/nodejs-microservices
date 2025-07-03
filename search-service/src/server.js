const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redisClient = new Redis(process.env.REDIS_URL);
const searchRoutes = require("./routes/search-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const PORT = process.env.PORT || 3004;
const app = express();
require("dotenv").config();
const connectToDatabase = require("./database/db");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");

connectToDatabase();

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Recieved  ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body} `);
  next();
});
// Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
app.use(sensitiveEndpointsLimiter);
// use routes->pass redis client
app.use(
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRoutes
);
app.use(errorHandler);
async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.created", (event) =>
      handlePostCreated(event, redisClient)
    );
    await consumeEvent("post.deleted", (event) =>
      handlePostDeleted(event, redisClient)
    );

    app.listen(PORT, () => {
      logger.info(`Search service is running on port ${PORT}`);
      logger.info(`Connected to Redis at ${process.env.REDIS_URL}`);
      logger.info(`Connected to MongoDB at ${process.env.MONGO_URL}`);
      logger.info(`Connected to RabbitMQ at ${process.env.RABBITMQ_URL}`);
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
}

// start server
startServer();
