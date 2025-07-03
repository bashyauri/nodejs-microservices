const logger = require("../utils/logger");
const { uploadMediaToCloudinary } = require("../helpers/cloudinaryHelper");
const Media = require("../models/Media");

const uploadMedia = async (req, res) => {
  logger.info("Uploading media...");
  try {
    if (!req.file) {
      logger.error("No file uploaded");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    console.log(req.file);

    const { originalname, mimetype, buffer } = req.file;
    if (!originalname || !mimetype || !buffer) {
      logger.error("Invalid file data");
      return res
        .status(400)
        .json({ success: false, message: "Invalid file data" });
    }
    const userId = req.user.userId;
    logger.info(`File details: ${originalname}, ${mimetype}`);
    const cloudinaryUpload = await uploadMediaToCloudinary(req.file, "images");
    logger.info(
      `Cloudinary upload successfully. Public Id: - ${cloudinaryUpload.public_id}`
    );
    console.log(cloudinaryUpload);

    const newMedia = new Media({
      publicId: cloudinaryUpload.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUpload.secure_url,
      userId,
    });
    await newMedia.save();
    res.status(201).json({
      success: true,
      mediaId: newMedia._id,
      url: newMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error uploading media:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to upload media" });
  }
};
const getAllMedia = async (req, res) => {
  logger.info("Fetching all media...");
  try {
    const medias = await Media.find({});
    if (!medias || medias.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No media found" });
    }
    res.status(200).json({ success: true, medias });
  } catch (error) {
    logger.error("Error fetching media:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch media" });
  }
};
module.exports = { uploadMedia, getAllMedia };
