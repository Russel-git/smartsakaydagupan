const Notification = require('../models/Notification');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, type } = req.query;
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Asynchronously purge any weather updates older than 3 days
    Notification.deleteMany({
      $or: [{ category: 'weather_updates' }, { type: 'weather_alert' }],
      createdAt: { $lt: threeDaysAgo },
    }).exec().catch(() => {});

    const userOrPublic = req.user
      ? [{ userId: req.user._id }, { userId: null }]
      : [{ userId: null }];

    const filter = {
      $or: userOrPublic,
      status: 'published',
      $nor: [
        {
          $or: [{ category: 'weather_updates' }, { type: 'weather_alert' }],
          createdAt: { $lt: threeDaysAgo },
        },
      ],
    };

    if (category && category !== 'all') {
      if (category === 'weather_updates') {
        filter.$and = [{ $or: [{ category: 'weather_updates' }, { type: 'weather_alert' }] }];
      } else if (category === 'complaint_updates') {
        filter.$and = [{ $or: [{ category: 'complaint_updates' }, { type: 'complaint_update' }] }];
      } else if (category === 'broadcast_by_admin') {
        filter.$and = [{
          $or: [
            { category: 'broadcast_by_admin' },
            { type: { $in: ['broadcast', 'system', 'fare_update'] } },
          ],
        }];
      } else {
        filter.category = category;
      }
    } else if (type) {
      filter.type = type;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter).sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, notifications, total, page, limit);
  } catch (error) { next(error); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    if (!req.user) {
      return apiResponse.success(res, { count: 0 });
    }
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const count = await Notification.countDocuments({
      $or: [{ userId: req.user._id }, { userId: null }],
      status: 'published',
      isRead: false,
      $nor: [
        {
          $or: [{ category: 'weather_updates' }, { type: 'weather_alert' }],
          createdAt: { $lt: threeDaysAgo },
        },
      ],
    });
    return apiResponse.success(res, { count });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ userId: req.user._id }, { userId: null }] },
      { isRead: true }, { new: true }
    );
    if (!notification) return apiResponse.error(res, 'Notification not found', 404);
    return apiResponse.success(res, notification, 'Marked as read');
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ userId: req.user._id }, { userId: null }], isRead: false }, { isRead: true }
    );
    return apiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
};

const broadcast = async (req, res, next) => {
  try {
    const { title, message, type, category, severity = 'info', locationArea = '', photoUrl, evidencePhoto, metadata = {} } = req.body;
    let finalCategory = category;
    let finalType = type || 'broadcast';

    if (!finalCategory) {
      if (finalType === 'weather_alert') finalCategory = 'weather_updates';
      else if (finalType === 'complaint_update') finalCategory = 'complaint_updates';
      else finalCategory = 'broadcast_by_admin';
    }

    const attachedPhoto = photoUrl || evidencePhoto || metadata?.photoUrl || metadata?.evidenceUrl || null;
    const finalMetadata = {
      ...metadata,
      ...(attachedPhoto ? { photoUrl: attachedPhoto, evidencePhoto: attachedPhoto } : {}),
    };

    const isWeather = finalCategory === 'weather_updates' || finalType === 'weather_alert';
    const expiresAt = isWeather
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Save primary broadcast record
    const primaryAlert = await Notification.create({
      userId: null,
      title,
      message,
      type: finalType,
      category: finalCategory,
      status: 'published',
      createdByRole: req.user.role || 'admin',
      authorUser: req.user._id,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      severity,
      locationArea: locationArea || '',
      metadata: finalMetadata,
      expiresAt,
    });

    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    const notifications = commuters.map((user) => ({
      userId: user._id,
      title,
      message,
      type: finalType,
      category: finalCategory,
      status: 'published',
      createdByRole: req.user.role || 'admin',
      authorUser: req.user._id,
      approvedBy: req.user._id,
      approvedAt: new Date(),
      severity,
      locationArea: locationArea || '',
      metadata: finalMetadata,
      expiresAt,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    return apiResponse.success(res, { primaryAlert, sentTo: notifications.length }, 'Broadcast sent successfully');
  } catch (error) { next(error); }
};

const requestRoadAlert = async (req, res, next) => {
  try {
    const { title, message, severity = 'warning', locationArea = '', photoUrl, evidencePhoto } = req.body;
    const attachedPhoto = photoUrl || evidencePhoto || null;
    const alert = await Notification.create({
      userId: null,
      title: title.trim(),
      message: message.trim(),
      type: 'broadcast',
      category: 'broadcast_by_admin',
      status: 'pending_approval',
      createdByRole: 'poso',
      authorUser: req.user._id,
      severity,
      locationArea: locationArea?.trim() || '',
      metadata: {
        submittedBy: `${req.user.firstName} ${req.user.lastName}`,
        badgeNumber: req.user.badgeNumber || 'POSO-ENFORCER',
        zone: req.user.assignedZone || '',
        ...(attachedPhoto ? { photoUrl: attachedPhoto, evidencePhoto: attachedPhoto } : {}),
      },
    });

    return apiResponse.success(
      res,
      alert,
      'Road alert drafted and submitted to LGU for verification and broadcast.',
      201
    );
  } catch (error) { next(error); }
};

const getPendingRoadAlerts = async (req, res, next) => {
  try {
    const alerts = await Notification.find({ status: 'pending_approval' })
      .populate('authorUser', 'firstName lastName badgeNumber department assignedZone email')
      .sort({ createdAt: -1 });

    return apiResponse.success(res, alerts, 'Pending road alerts retrieved.');
  } catch (error) { next(error); }
};

const getAlertFeed = async (req, res, next) => {
  try {
    const { status, limit = 100 } = req.query;
    const filter = {
      $or: [{ type: 'broadcast' }, { category: 'broadcast_by_admin' }, { type: 'system' }],
      userId: null,
    };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'archived' };
    }

    const alerts = await Notification.find(filter)
      .populate('authorUser', 'firstName lastName badgeNumber department')
      .populate('approvedBy', 'firstName lastName department')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return apiResponse.success(res, alerts, 'Alerts feed retrieved.');
  } catch (error) { next(error); }
};

const archiveAnnouncement = async (req, res, next) => {
  try {
    const alert = await Notification.findById(req.params.id);
    if (!alert) return apiResponse.error(res, 'Announcement not found.', 404);

    alert.status = 'archived';
    await alert.save();

    return apiResponse.success(res, alert, 'Announcement archived successfully.');
  } catch (error) { next(error); }
};

const restoreAnnouncement = async (req, res, next) => {
  try {
    const alert = await Notification.findById(req.params.id);
    if (!alert) return apiResponse.error(res, 'Announcement not found.', 404);

    alert.status = 'published';
    await alert.save();

    return apiResponse.success(res, alert, 'Announcement restored and published.');
  } catch (error) { next(error); }
};

const permanentDeleteAnnouncement = async (req, res, next) => {
  try {
    const alert = await Notification.findById(req.params.id);
    if (!alert) return apiResponse.error(res, 'Announcement not found.', 404);

    // Delete primary record
    await Notification.findByIdAndDelete(req.params.id);

    // Also remove any commuter copies that originated from this broadcast
    await Notification.deleteMany({
      $or: [
        { 'metadata.originalAlertId': alert._id },
        { title: alert.title, createdAt: { $gte: new Date(alert.createdAt.getTime() - 60000), $lte: new Date(alert.createdAt.getTime() + 60000) } },
      ],
    }).exec().catch(() => {});

    return apiResponse.success(res, null, 'Announcement permanently removed.');
  } catch (error) { next(error); }
};

const approveRoadAlert = async (req, res, next) => {
  try {
    const alert = await Notification.findById(req.params.id);
    if (!alert) return apiResponse.error(res, 'Road alert not found.', 404);

    alert.status = 'published';
    alert.approvedBy = req.user._id;
    alert.approvedAt = new Date();
    await alert.save();

    // Broadcast to all active commuters
    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    if (commuters.length > 0) {
      const commuterNotifs = commuters.map((u) => ({
        userId: u._id,
        title: `🚨 ${alert.title}`,
        message: alert.message,
        type: 'broadcast',
        category: 'broadcast_by_admin',
        status: 'published',
        createdByRole: alert.createdByRole,
        authorUser: alert.authorUser,
        approvedBy: req.user._id,
        approvedAt: new Date(),
        severity: alert.severity,
        locationArea: alert.locationArea,
        metadata: {
          originalAlertId: alert._id,
          verifiedByLgu: true,
          photoUrl: alert.metadata?.photoUrl || alert.metadata?.evidencePhoto || null,
          evidencePhoto: alert.metadata?.photoUrl || alert.metadata?.evidencePhoto || null,
        },
      }));
      await Notification.insertMany(commuterNotifs);
    }

    return apiResponse.success(res, alert, 'Road alert verified and broadcast to all commuters.');
  } catch (error) { next(error); }
};

const rejectRoadAlert = async (req, res, next) => {
  try {
    const reason = req.body.reason || req.body.rejectionReason || 'Declined by City LGU verification desk.';
    const alert = await Notification.findById(req.params.id);
    if (!alert) return apiResponse.error(res, 'Road alert not found.', 404);

    alert.status = 'rejected';
    alert.rejectionReason = reason;
    alert.approvedBy = req.user._id;
    alert.approvedAt = new Date();
    await alert.save();

    return apiResponse.success(res, alert, 'Road alert rejected.');
  } catch (error) { next(error); }
};

const sendToUser = async (req, res, next) => {
  try {
    const { userId, title, message, type, category } = req.body;
    const user = await User.findById(userId);
    if (!user) return apiResponse.error(res, 'User not found', 404);

    let finalCategory = category;
    let finalType = type || 'system';
    if (!finalCategory) {
      if (finalType === 'weather_alert') finalCategory = 'weather_updates';
      else if (finalType === 'complaint_update') finalCategory = 'complaint_updates';
      else finalCategory = 'broadcast_by_admin';
    }

    const isWeather = finalCategory === 'weather_updates' || finalType === 'weather_alert';
    const expiresAt = isWeather
      ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: finalType,
      category: finalCategory,
      status: 'published',
      expiresAt,
    });
    return apiResponse.success(res, notification, 'Notification sent', 201);
  } catch (error) { next(error); }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  broadcast,
  sendToUser,
  requestRoadAlert,
  getPendingRoadAlerts,
  getAlertFeed,
  approveRoadAlert,
  rejectRoadAlert,
  archiveAnnouncement,
  restoreAnnouncement,
  permanentDeleteAnnouncement,
};
