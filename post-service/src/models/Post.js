const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    mediaIds: [
      {
        type: String,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
// Add a text index on the content field for full-text search
postSchema.index({ content: "text" });
const Post = mongoose.model("Post", postSchema);
module.exports = Post;
