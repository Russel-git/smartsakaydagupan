const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Route = require('../models/Route');
const Terminal = require('../models/Terminal');
const Notification = require('../models/Notification');
const apiResponse = require('../utils/apiResponse');

const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCommuters,
      verifiedUsers,
      posoOfficersCount,
      totalComplaints,
      pendingComplaints,
      underReviewComplaints,
      endorsedComplaints,
      resolvedComplaints,
      totalRoutes,
      activeRoutes,
      totalTerminals,
      pendingAlertsCount,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'commuter', isActive: true }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'poso', isActive: true }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'under_review' }),
      Complaint.countDocuments({ status: 'endorsed_to_lgu' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Route.countDocuments(),
      Route.countDocuments({ isActive: true }),
      Terminal.countDocuments(),
      Notification.countDocuments({ status: 'pending_approval' }),
    ]);

    return apiResponse.success(res, {
      users: { total: totalUsers, commuters: totalCommuters, verified: verifiedUsers, poso: posoOfficersCount },
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        underReview: underReviewComplaints,
        under_review: underReviewComplaints,
        endorsed: endorsedComplaints,
        resolved: resolvedComplaints,
      },
      routes: { total: totalRoutes, active: activeRoutes },
      terminals: { total: totalTerminals },
      alerts: { pendingApproval: pendingAlertsCount },
    }, 'Dashboard stats retrieved');
  } catch (error) { next(error); }
};

const getAccountMetrics = async (req, res, next) => {
  try {
    const [
      activeAccounts,
      suspendedAccounts,
      lguAccounts,
      posoAccounts,
      commuterAccounts,
      adminAccounts,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: 'lgu' }),
      User.countDocuments({ role: 'poso' }),
      User.countDocuments({ role: 'commuter' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    return apiResponse.success(
      res,
      {
        activeAccounts,
        suspendedAccounts,
        lguAccounts,
        posoAccounts,
        commuterAccounts,
        adminAccounts,
      },
      'Account governance metrics retrieved successfully'
    );
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

const getUserScalabilityAnalytics = async (req, res, next) => {
  try {
    const monthsCount = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 3), 24);
    const now = new Date();

    const monthList = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const shortLabel = d.toLocaleString('en-US', { month: 'short' });
      monthList.push({ key, label, shortLabel });
    }

    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1, 0, 0, 0, 0);

    const [
      totalUsers,
      commutersCount,
      lguCount,
      posoCount,
      adminCount,
      activeCount,
      suspendedCount,
      userGrowthRaw,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'commuter' }),
      User.countDocuments({ role: 'lgu' }),
      User.countDocuments({ role: 'poso' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
              role: '$role',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const growthMap = {};
    userGrowthRaw.forEach((item) => {
      const m = item._id?.month;
      const r = item._id?.role;
      if (m) {
        if (!growthMap[m]) growthMap[m] = {};
        growthMap[m][r] = item.count;
      }
    });

    const monthlyTrends = monthList.map((m) => {
      const counts = growthMap[m.key] || {};
      const commuter = counts.commuter || 0;
      const lgu = counts.lgu || 0;
      const poso = counts.poso || 0;
      const admin = counts.admin || 0;
      const totalNew = commuter + lgu + poso + admin;
      return {
        key: m.key,
        label: m.label,
        shortLabel: m.shortLabel,
        commuter,
        lgu,
        poso,
        admin,
        total: totalNew,
      };
    });

    return apiResponse.success(
      res,
      {
        totals: {
          totalUsers,
          commuters: commutersCount,
          lgu: lguCount,
          poso: posoCount,
          admin: adminCount,
          active: activeCount,
          suspended: suspendedCount,
        },
        monthlyTrends,
      },
      'User scalability analytics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getAccountMetrics,
  getActivity,
  getAuditLogs,
  getUserScalabilityAnalytics,
};

