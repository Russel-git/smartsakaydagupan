const express = require('express');
const router = express.Router();
const fareController = require('../controllers/fareController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { updateFareSchema } = require('../validators/fareValidator');

router.get('/', fareController.getActiveFares);
router.get('/calculate', fareController.calculateFare);
router.get('/matrix', fareController.getFareMatrix);
router.put('/:id', authMiddleware, rbac('admin', 'lgu'), validate(updateFareSchema), fareController.updateFare);
router.post('/revert/:vehicleType', authMiddleware, rbac('admin', 'lgu'), fareController.revertFare);
router.get('/history', authMiddleware, rbac('admin', 'lgu'), fareController.getFareHistory);

module.exports = router;
