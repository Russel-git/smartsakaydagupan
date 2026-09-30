const AuditLog = require('../models/AuditLog');

/**
 * Record an audit log event
 * @param {Object} req Express request object
 * @param {Object} data Event parameters
 */
const logAuditEvent = async (req, { action, resourceType, resourceId = '', details = {} }) => {
  try {
    const user = req.user || {};
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    await AuditLog.create({
      action,
      performedBy: user._id || user.id,
      performedByName: user.firstName ? `${user.firstName} ${user.lastName}` : (user.email || 'Admin'),
      performedByEmail: user.email || '',
      role: user.role || 'admin',
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = { logAuditEvent };
