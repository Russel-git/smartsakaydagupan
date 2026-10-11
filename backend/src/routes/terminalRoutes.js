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

const { getBusTerminals } = require('../controllers/routeController');

// Public route to fetch terminals (optionally with auth for personalized/admin views)
router.get('/', optionalAuth, terminalController.getAllTerminals);
router.get('/bus', optionalAuth, getBusTerminals);
router.get('/:id', optionalAuth, terminalController.getTerminalById);

// Admin & LGU management routes
router.post(
  '/',
  authMiddleware,
  rbac('admin', 'lgu'),
  validate(createTerminalSchema),
  terminalController.createTerminal
);

router.put(
  '/:id',
  authMiddleware,
  rbac('admin', 'lgu'),
  validate(updateTerminalSchema),
  terminalController.updateTerminal
);

router.delete(
  '/clear-all',
  authMiddleware,
  rbac('admin', 'lgu'),
  terminalController.clearAllTerminals
);

router.delete(
  '/:id',
  authMiddleware,
  rbac('admin', 'lgu'),
  terminalController.deleteTerminal
);

module.exports = router;
