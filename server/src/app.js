const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const httpsRedirect = require('./config/httpsRedirect');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const { clean: cleanXss } = require('xss-clean/lib/xss');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const config = require('./config/env');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fareRoutes = require('./routes/fareRoutes');
const routeRoutes = require('./routes/routeRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const terminalRoutes = require('./routes/terminalRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.nodeEnv === 'development'
    ? true
    : process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
});
// Enforce HTTPS in Render/Tunnel environments
app.use(httpsRedirect);

}));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
    req.body = cleanXss(req.body);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params);
    req.params = cleanXss(req.params);
  }
  next();
});

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'SmartSakay Dagupan API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/terminals', terminalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
