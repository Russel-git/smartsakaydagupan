const Notification = require('../models/Notification');
const User = require('../models/User');
const apiResponse = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { $or: [{ userId: req.user._id }, { userId: null }] };
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
    const { title, message, type } = req.body;
    const commuters = await User.find({ role: 'commuter', isActive: true }).select('_id');
    const notifications = commuters.map((user) => ({
      userId: user._id, title, message, type: type || 'broadcast',
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
    return apiResponse.success(res, { sentTo: notifications.length }, 'Broadcast sent successfully');
  } catch (error) { next(error); }
};

const sendToUser = async (req, res, next) => {
  try {
    const { userId, title, message, type } = req.body;
    const user = await User.findById(userId);
    if (!user) return apiResponse.error(res, 'User not found', 404);
    const notification = await Notification.create({ userId, title, message, type: type || 'system' });
    return apiResponse.success(res, notification, 'Notification sent', 201);
  } catch (error) { next(error); }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, broadcast, sendToUser };
