const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit");

  try {
    const { query } = req.query;

    if (!query) {
      logger.warn("Search query is missing");
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cachedData = await req.redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Cache hit for query: ${query}`);
      return res.status(200).json({
        success: true,
        source: "cache",
        data: JSON.parse(cachedData),
      });
    }

    logger.info(`Cache miss for query: ${query}`);

    const results = await Search.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    if (results.length === 0) {
      logger.info("No results found for query: %s", query);
      return res.status(404).json({
        success: false,
        message: "No results found",
      });
    }

    // Cache results for 10 minutes
    await req.redisClient.set(cacheKey, JSON.stringify(results), "EX", 600);

    return res.status(200).json({
      success: true,
      source: "database",
      data: results,
    });
  } catch (error) {
    logger.error("Error in searchPostController: %o", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { searchPostController };
