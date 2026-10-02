const express = require('express');
const router = express.Router();
const terminalController = require('../controllers/terminalController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const {
  createTerminalSchema,
  updateTerminalSchema,
} = require('../validators/terminalValidator');

// Public route to fetch terminals (optionally with auth for personalized/admin views)
router.get('/', optionalAuth, terminalController.getAllTerminals);
router.get('/:id', optionalAuth, terminalController.getTerminalById);

// Admin-only management routes
router.post(
  '/',
  authMiddleware,
  rbac('admin'),
  validate(createTerminalSchema),
  terminalController.createTerminal
);

router.put(
  '/:id',
  authMiddleware,
  rbac('admin'),
  validate(updateTerminalSchema),
  terminalController.updateTerminal
);

router.delete(
  '/clear-all',
  authMiddleware,
  rbac('admin'),
  terminalController.clearAllTerminals
);

router.delete(
  '/:id',
  authMiddleware,
  rbac('admin'),
  terminalController.deleteTerminal
);

module.exports = router;
