const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createRouteSchema, updateRouteSchema } = require('../validators/routeValidator');

router.get('/', routeController.getAllRoutes);
router.get('/bus-terminals', routeController.getBusTerminals);
router.get('/nearby', routeController.getNearbyRoutes);
router.get('/:id', routeController.getRouteById);

router.post('/', authMiddleware, rbac('admin'), validate(createRouteSchema), routeController.createRoute);
router.put('/:id', authMiddleware, rbac('admin'), validate(updateRouteSchema), routeController.updateRoute);
router.delete('/:id', authMiddleware, rbac('admin'), routeController.deleteRoute);

module.exports = router;
