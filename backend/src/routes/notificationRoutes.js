const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  broadcastSchema,
  sendToUserSchema,
  roadAlertRequestSchema,
  rejectRoadAlertSchema,
} = require('../validators/notificationValidator');

// Public or Authenticated Notifications feed (guests see public announcements)
router.get('/', optionalAuth, notificationController.getNotifications);
router.get('/public', optionalAuth, notificationController.getNotifications);

router.use(authMiddleware);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/delete-all-read', notificationController.deleteAllRead);
router.delete('/:id', notificationController.deleteNotification);

// Alert feed for Admin, LGU, POSO dashboards
router.get('/feed', rbac('admin', 'lgu', 'poso'), notificationController.getAlertFeed);

// POSO road alert draft submission
router.post('/request', rbac('poso', 'admin'), validate(roadAlertRequestSchema), notificationController.requestRoadAlert);

// LGU verification & broadcast desk
router.get('/pending', rbac('lgu', 'admin'), notificationController.getPendingRoadAlerts);
router.patch('/:id/approve', rbac('lgu', 'admin'), notificationController.approveRoadAlert);
router.patch('/:id/reject', rbac('lgu', 'admin'), validate(rejectRoadAlertSchema), notificationController.rejectRoadAlert);

// Direct broadcasts by LGU / Admin
router.post('/broadcast', rbac('admin', 'lgu'), validate(broadcastSchema), notificationController.broadcast);
router.post('/send', rbac('admin', 'lgu'), validate(sendToUserSchema), notificationController.sendToUser);

// Archive management
router.patch('/:id/archive', rbac('admin', 'lgu'), notificationController.archiveAnnouncement);
router.patch('/:id/restore', rbac('admin', 'lgu'), notificationController.restoreAnnouncement);
router.delete('/:id/permanent', rbac('admin', 'lgu'), notificationController.permanentDeleteAnnouncement);

module.exports = router;
