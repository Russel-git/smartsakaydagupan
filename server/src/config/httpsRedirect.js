// src/config/httpsRedirect.js
module.exports = (req, res, next) => {
  // Enforce HTTPS (Render terminates TLS but forwards HTTP)
  if (req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.originalUrl}`);
  }
  next();
};
