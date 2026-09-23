const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.use(authMiddleware);
router.use(rbac('admin'));
router.get('/stats', adminController.getStats);
router.get('/activity', adminController.getActivity);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;

