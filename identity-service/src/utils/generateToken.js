const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");

const generateTokens = async (user) => {
  const accessTokenExpiresIn = 60 * 60; // 1 hour in seconds
  const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: accessTokenExpiresIn }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenExpiresAt = new Date(
    Date.now() + refreshTokenExpiresIn * 1000
  );
  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt: refreshTokenExpiresAt,
  });
  return {
    accessToken,
    accessTokenExpiresIn,
    refreshToken,
    refreshTokenExpiresAt,
  };
};

module.exports = { generateTokens };
