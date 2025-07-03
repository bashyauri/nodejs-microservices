const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowecase: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      return next(error);
    }
  }
});
userSchema.methods.comparePassword = async function (candidatePasword) {
  try {
    return await argon2.verify(this.password, candidatePasword);
  } catch (err) {
    console.log(err);
  }
};
userSchema.index({ username: "text" });
const User = mongoose.model("User", userSchema);
module.exports = User;
