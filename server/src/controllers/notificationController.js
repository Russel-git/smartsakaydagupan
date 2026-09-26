const Notification = require('../models/Notification');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, type } = req.query;
    const filter = { $or: [{ userId: req.user._id }, { userId: null }] };

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
    const count = await Notification.countDocuments({
      $or: [{ userId: req.user._id }, { userId: null }], isRead: false,
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
    const { title, message, type, category } = req.body;
    let finalCategory = category;
    let finalType = type || 'broadcast';

    if (!finalCategory) {
      if (finalType === 'weather_alert') finalCategory = 'weather_updates';
      else if (finalType === 'complaint_update') finalCategory = 'complaint_updates';
      else finalCategory = 'broadcast_by_admin';
    }

    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    const notifications = commuters.map((user) => ({
      userId: user._id,
      title,
      message,
      type: finalType,
      category: finalCategory,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    return apiResponse.success(res, { sentTo: notifications.length }, 'Broadcast sent successfully');
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

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: finalType,
      category: finalCategory,
    });
    return apiResponse.success(res, notification, 'Notification sent', 201);
  } catch (error) { next(error); }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, broadcast, sendToUser };
