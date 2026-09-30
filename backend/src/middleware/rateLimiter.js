const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 2000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development mode, bypass rate limiting completely
    if (isDev) return true;
    // In production, bypass non-sensitive polling & health endpoints
    if (req.path.includes('/notifications/unread-count') || req.path.includes('/health')) {
      return true;
    }
    return false;
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 60,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development mode, bypass auth rate limiting
    if (isDev) return true;
    // Do not rate-limit token refreshes or logout
    if (req.path === '/refresh-token' || req.path === '/logout') {
      return true;
    }
    return false;
  },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 1000 : 60,
  message: { success: false, message: 'Chat rate limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev,
});

module.exports = { generalLimiter, authLimiter, chatLimiter };
