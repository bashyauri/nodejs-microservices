const logger = require("../utils/logger");
const Media = require("../models/Media"); // Assuming you have a Media model to handle media files
const { deleteMediaFromCloudinary } = require("../helpers/cloudinaryHelper");

const handlePostDeleted = async (eventData) => {
  logger.info("Handling post deleted event:", eventData);
  const { postId, userId, mediaIds } = eventData;
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    if (mediaToDelete.length === 0) {
      logger.warn(`No media found for postId: ${postId}`);
      return;
    }
    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(`Deleted media with ID: ${media._id} for postId: ${postId}`);
    }
    logger.info(`All media files deleted for postId: ${postId}`);
  } catch (error) {
    logger.error("Error handling post deleted event:", error);
    throw error;
  }
};

module.exports = {
  handlePostDeleted,
};
