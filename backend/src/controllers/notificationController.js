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

    if (req.user) {
      filter.deletedForUsers = { $ne: req.user._id };
    }

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

    const rawNotifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // De-duplicate: Ensure that if an alert exists as both broadcast (userId: null)
    // and legacy user copy, or was broadcast multiple times, each alert appears exactly once!
    const seenMap = new Set();
    const uniqueNotifications = [];

    for (const notif of rawNotifications) {
      const normTitle = (notif.title || '').trim().replace(/^🚨\s*/, '');
      const createdMinute = Math.floor(new Date(notif.createdAt).getTime() / 60000);
      const originalAlertId = notif.metadata?.originalAlertId?.toString();
      const dedupKey = originalAlertId || `${normTitle}_${notif.category || notif.type}_${createdMinute}`;

      if (notif.userId == null || notif.type === 'broadcast' || notif.category === 'weather_updates' || notif.category === 'broadcast_by_admin') {
        if (seenMap.has(dedupKey)) {
          continue;
        }
        seenMap.add(dedupKey);
      }

      if (req.user) {
        if (notif.userId == null) {
          const isReadByUser = Array.isArray(notif.readByUsers) &&
            notif.readByUsers.some((u) => u.toString() === req.user._id.toString());
          notif.isRead = Boolean(notif.isRead || isReadByUser);
        }
      }

      uniqueNotifications.push(notif);
    }

    const total = uniqueNotifications.length;
    const startIndex = (page - 1) * limit;
    const paginatedNotifs = uniqueNotifications.slice(startIndex, startIndex + parseInt(limit));

    return apiResponse.paginated(res, paginatedNotifs, total, page, limit);
  } catch (error) { next(error); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    if (!req.user) {
      return apiResponse.success(res, { count: 0 });
    }
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const userId = req.user._id;

    const unreadCandidates = await Notification.find({
      $or: [{ userId }, { userId: null }],
      status: 'published',
      deletedForUsers: { $ne: userId },
      $nor: [
        {
          $or: [{ category: 'weather_updates' }, { type: 'weather_alert' }],
          createdAt: { $lt: threeDaysAgo },
        },
      ],
    }).sort({ createdAt: -1 }).lean();

    const seenMap = new Set();
    let count = 0;

    for (const notif of unreadCandidates) {
      const normTitle = (notif.title || '').trim().replace(/^🚨\s*/, '');
      const createdMinute = Math.floor(new Date(notif.createdAt).getTime() / 60000);
      const originalAlertId = notif.metadata?.originalAlertId?.toString();
      const dedupKey = originalAlertId || `${normTitle}_${notif.category || notif.type}_${createdMinute}`;

      if (notif.userId == null || notif.type === 'broadcast' || notif.category === 'weather_updates' || notif.category === 'broadcast_by_admin') {
        if (seenMap.has(dedupKey)) continue;
        seenMap.add(dedupKey);

        const isReadByUser = Array.isArray(notif.readByUsers) &&
          notif.readByUsers.some((u) => u.toString() === userId.toString());
        if (!notif.isRead && !isReadByUser) {
          count++;
        }
      } else {
        if (!notif.isRead) count++;
      }
    }

    return apiResponse.success(res, { count });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return apiResponse.error(res, 'Notification not found', 404);

    if (notification.userId && notification.userId.toString() === req.user._id.toString()) {
      notification.isRead = true;
      await notification.save();
    } else {
      await Notification.findByIdAndUpdate(req.params.id, {
        $addToSet: { readByUsers: req.user._id },
      });
      notification.isRead = true;
    }
    return apiResponse.success(res, notification, 'Marked as read');
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Promise.all([
      Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true }),
      Notification.updateMany(
        { userId: null, status: 'published' },
        { $addToSet: { readByUsers: req.user._id } }
      ),
    ]);
    return apiResponse.success(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) return apiResponse.error(res, 'Notification not found.', 404);

    if (notification.userId && notification.userId.toString() === req.user._id.toString()) {
      await Notification.findByIdAndDelete(id);
    } else {
      // Broadcast notification (userId: null) or public alert: add user to deletedForUsers
      await Notification.findByIdAndUpdate(id, {
        $addToSet: { deletedForUsers: req.user._id },
      });
    }
    return apiResponse.success(res, null, 'Notification deleted successfully.');
  } catch (error) { next(error); }
};

const deleteAllRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Delete user-specific notifications that are marked as read
    const userDeleteResult = await Notification.deleteMany({
      userId,
      isRead: true,
    });

    // 2. Hide broadcast/public notifications that this user has marked as read
    const broadcastUpdateResult = await Notification.updateMany(
      {
        userId: null,
        status: 'published',
        $or: [{ readByUsers: userId }, { isRead: true }],
      },
      {
        $addToSet: { deletedForUsers: userId },
      }
    );

    return apiResponse.success(
      res,
      {
        deletedUserCount: userDeleteResult.deletedCount || 0,
        hiddenBroadcastCount: broadcastUpdateResult.modifiedCount || 0,
      },
      'All read notifications deleted successfully.'
    );
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

    // Save only ONE primary broadcast record (sent to all commuters via userId: null)
    const primaryAlert = await Notification.create({
      userId: null,
      title: title.trim(),
      message: message.trim(),
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

    return apiResponse.success(res, primaryAlert, 'Broadcast sent successfully');
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
  deleteNotification,
  deleteAllRead,
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
