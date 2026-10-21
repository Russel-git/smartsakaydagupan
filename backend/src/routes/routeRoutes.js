const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createRouteSchema, updateRouteSchema } = require('../validators/routeValidator');

router.get('/', optionalAuth, routeController.getAllRoutes);
router.get('/bus-terminals', optionalAuth, routeController.getBusTerminals);
router.get('/nearby', routeController.getNearbyRoutes);
router.get('/:id', routeController.getRouteById);

router.post('/', authMiddleware, rbac('admin', 'lgu'), validate(createRouteSchema), routeController.createRoute);
router.put('/:id', authMiddleware, rbac('admin', 'lgu'), validate(updateRouteSchema), routeController.updateRoute);
router.delete('/:id', authMiddleware, rbac('admin', 'lgu'), routeController.deleteRoute);

module.exports = router;
