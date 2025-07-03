const express = require("express");

const helmet = require("helmet");
const Redis = require("ioredis");
const cors = require("cors");
const mediaRoutes = require("./routes/media-routes");
const { RedisStore } = require("rate-limit-redis");

const redisClient = new Redis(process.env.REDIS_URL);
const { rateLimit } = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const PORT = process.env.PORT || 3003;
const app = express();
require("dotenv").config();
const connectToDatabase = require("./database/db");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./eventHandlers/media-event-handlers");
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
app.use("/api/media", mediaRoutes);

app.use(errorHandler);
async function startServer() {
  try {
    await connectToRabbitMQ();
    // consume the events
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Media service is running on port ${PORT}`);
      logger.info(`Connected to Redis at ${process.env.REDIS_URL}`);
      logger.info(`Connected to MongoDB at ${process.env.MONGO_URL}`);
      logger.info(`Connected to RabbitMQ at ${process.env.RABBITMQ_URL}`);
    });
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
    process.exit(1); // Exit the process if RabbitMQ connection fails
  }
}
startServer();
