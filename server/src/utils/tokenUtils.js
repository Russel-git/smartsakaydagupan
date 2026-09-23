const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
