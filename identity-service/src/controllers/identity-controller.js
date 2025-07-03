const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { generateTokens } = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
// user registration
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit..");
  try {
    //   validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists", { email, username });
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    user = new User({
      username,
      email,
      password,
    });
    await user.save();
    logger.info("User registered successfully", { userId: user._id });
    const { accessToken, refreshToken } = await generateTokens(user);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error occurred during registration", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// user login
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("Invalid User");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    // user valid password or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }
    const { accessToken, refreshToken } = await generateTokens(user);
    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Error occurred during login", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// refresh token
const userRefreshToken = async (req, res) => {
  logger.info("Refresh token endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh Token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("User not found for the provided refresh token");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user
    );
    // delete the old refresh token
    await RefreshToken.deleteOne({ id: storedToken._id });
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Error occurred during refresh token", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// logout
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh Token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      logger.warn("Invalid refresh token");
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    // delete the refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });
    logger.info("User logged out successfully", { userId: storedToken.user });
    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    logger.error("Error occurred during logout", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { registerUser, loginUser, userRefreshToken, logoutUser };
