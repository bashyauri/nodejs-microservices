const logger = require("../utils/logger");
const Search = require("../models/Search");

// Handle post created event
async function handlePostCreated(event, redisClient) {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();

    logger.info(
      `Search Post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );

    await deleteKeysByPattern("search:*", redisClient);
  } catch (error) {
    logger.error("Error handling post created event: %o", error);
  }
}

// Handle post deleted event
async function handlePostDeleted(event, redisClient) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });

    logger.info(`Search Post deleted: ${event.postId}`);

    await deleteKeysByPattern("search:*", redisClient);
  } catch (error) {
    logger.error("Error handling post deleted event: %o", error);
  }
}

// Utility to delete Redis keys by pattern (non-blocking with scanStream)
async function deleteKeysByPattern(pattern, redisClient) {
  const stream = redisClient.scanStream({ match: pattern });
  const keys = [];

  for await (const resultKeys of stream) {
    keys.push(...resultKeys);
  }

  if (keys.length > 0) {
    await redisClient.del(...keys);
    logger.info(`Deleted ${keys.length} cache keys matching: ${pattern}`);
  } else {
    logger.info(`No cache keys matched pattern: ${pattern}`);
  }
}

module.exports = { handlePostCreated, handlePostDeleted };
