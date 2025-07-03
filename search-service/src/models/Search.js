const mongoose = require("mongoose");
const { Schema } = mongoose;

const searchSchema = new Schema(
  {
    postId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // title: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
searchSchema.index({ content: "text", title: "text" });
searchSchema.index({ createdAt: -1 });

// Check if the model already exists before defining it
const Search = mongoose.model("Search", searchSchema);

module.exports = Search;
