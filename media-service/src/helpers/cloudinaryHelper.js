const cloudinary = require("../config/cloudinary");
const logger = require("../utils/logger");

// const uploadMediaToCloudinary = async (filePath, folder) => {
//   try {
//     const result = cloudinary.uploader.upload_stream(filePath, {
//       folder: folder,
//       resource_type: "auto",
//     });
//     return {
//       url: result.secure_url,
//       publicId: result.public_id,
//     };
//   } catch (error) {
//     logger.error("Error uploading to Cloudinary:", error);
//     throw new Error("Failed to upload image to Cloudinary");
//   }
// };

const uploadMediaToCloudinary = (file, folder = "") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder,
      },
      (error, result) => {
        if (error) {
          logger.error("Error while uploading media to Cloudinary:", error);
          return reject(new Error("Failed to upload media to Cloudinary"));
        }
        resolve({
          url: result.secure_url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          originalName: file.originalname,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
};
const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Successfully deleted media from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error("Error deleting media from Cloudinary:", error);
    throw new Error("Failed to delete media from Cloudinary");
  }
};
module.exports = {
  uploadMediaToCloudinary,
  deleteMediaFromCloudinary,
};
