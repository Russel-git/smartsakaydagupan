const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const { chatLimiter } = require('../middleware/rateLimiter');

router.get('/status', assistantController.getStatus);

router.use(authMiddleware);
router.use(rbac('commuter', 'admin'));
router.post('/chat', chatLimiter, assistantController.chat);
router.get('/history', assistantController.getHistory);
router.delete('/history', assistantController.clearHistory);

module.exports = router;
