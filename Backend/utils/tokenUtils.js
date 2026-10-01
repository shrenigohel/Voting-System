const jwt = require("jsonwebtoken");

exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

exports.sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = exports.generateToken(user._id);

  // Remove password from output (if still present)
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user,
  });
};
