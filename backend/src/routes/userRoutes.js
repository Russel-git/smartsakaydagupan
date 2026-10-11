const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { uploadEvidence } = require('../middleware/upload');
const { updateProfileSchema, changePasswordSchema } = require('../validators/authValidator');

router.use(authMiddleware);
router.get('/me', userController.getProfile);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.post('/me/photo', uploadEvidence.single('photo'), userController.uploadProfilePhoto);
router.put('/me/password', validate(changePasswordSchema), userController.changePassword);
router.delete('/me', userController.deleteMyAccount);
router.get('/', rbac('admin', 'lgu'), userController.getAllUsers);
router.post('/', rbac('admin', 'lgu'), userController.createUser);
router.put('/:id/role', rbac('admin'), userController.updateUserRole);
router.put('/:id/status', rbac('admin', 'lgu'), userController.updateUserStatus);
router.put('/:id/password', rbac('admin', 'lgu'), userController.adminResetPassword);
router.delete('/:id', rbac('admin', 'lgu'), userController.deleteUser);

module.exports = router;
