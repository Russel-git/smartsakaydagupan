// src/config/httpsRedirect.js
module.exports = (req, res, next) => {
  // Enforce HTTPS in production (Render terminates TLS but forwards HTTP)
  if (process.env.NODE_ENV === 'production' && req.get('x-forwarded-proto') && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }
  next();
};
