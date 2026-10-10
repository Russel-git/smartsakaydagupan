const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.use(authMiddleware);
router.get('/stats', rbac('admin', 'lgu'), adminController.getStats);
router.get('/metrics', rbac('admin', 'lgu'), adminController.getAccountMetrics);
router.get('/activity', rbac('admin', 'lgu'), adminController.getActivity);
router.get('/audit-logs', rbac('admin'), adminController.getAuditLogs);

module.exports = router;

