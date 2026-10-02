const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiResponse.error(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
    if (!user) {
      return apiResponse.error(res, 'User not found.', 401);
    }
    if (!user.isActive) {
      return apiResponse.error(res, 'Account has been deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return apiResponse.error(res, 'Token expired. Please refresh your token.', 401);
    }
    return apiResponse.error(res, 'Invalid token.', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently continue without user
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
