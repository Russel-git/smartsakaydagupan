const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Route = require('../models/Route');
const apiResponse = require('../utils/apiResponse');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalCommuters, totalComplaints, pendingComplaints, underReviewComplaints, resolvedComplaints, totalRoutes] =
      await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'commuter', isActive: true }),
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: 'pending' }),
        Complaint.countDocuments({ status: 'under_review' }),
        Complaint.countDocuments({ status: 'resolved' }),
        Route.countDocuments({ isActive: true }),
      ]);

    return apiResponse.success(res, {
      users: { total: totalUsers, commuters: totalCommuters },
      complaints: { total: totalComplaints, pending: pendingComplaints, underReview: underReviewComplaints, resolved: resolvedComplaints },
      routes: { total: totalRoutes },
    }, 'Dashboard stats retrieved');
  } catch (error) { next(error); }
};

const getActivity = async (req, res, next) => {
  try {
    const [recentUsers, recentComplaints] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt'),
      Complaint.find().sort({ createdAt: -1 }).limit(5)
        .populate('userId', 'firstName lastName').select('subject category status createdAt'),
    ]);
    return apiResponse.success(res, { recentUsers, recentComplaints });
  } catch (error) { next(error); }
};

const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
  try {
    const { action, resourceType, page = 1, limit = 20 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return apiResponse.success(res, {
      logs,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      },
    }, 'Audit logs retrieved');
  } catch (error) { next(error); }
};

module.exports = { getStats, getActivity, getAuditLogs };

