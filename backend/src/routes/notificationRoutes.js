const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { broadcastSchema, sendToUserSchema } = require('../validators/notificationValidator');

router.use(authMiddleware);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.post('/broadcast', rbac('admin'), validate(broadcastSchema), notificationController.broadcast);
router.post('/send', rbac('admin'), validate(sendToUserSchema), notificationController.sendToUser);

module.exports = router;
