// Load environment variables
require("dotenv").config();

const mongoose = require("mongoose");
const logger = require("../utils/logger");

// Destructure URI from environment variables
const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in the .env file");
  process.exit(1);
}

const connectToDatabase = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    logger.info(`✅ Connected to MongoDB: ${conn.connection.name}`);
    console.log(`✅ Connected to MongoDB: ${conn.connection.name}`);
  } catch (error) {
    logger.error("❌ Error connecting to MongoDB:", error.message);
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectToDatabase;
