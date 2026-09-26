const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { updateProfileSchema, changePasswordSchema } = require('../validators/authValidator');

router.use(authMiddleware);
router.get('/me', userController.getProfile);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.put('/me/password', validate(changePasswordSchema), userController.changePassword);
router.get('/', rbac('superadmin'), userController.getAllUsers);
router.post('/', rbac('superadmin'), userController.createUser);
router.put('/:id/role', rbac('superadmin'), userController.updateUserRole);
router.put('/:id/status', rbac('superadmin'), userController.updateUserStatus);
router.delete('/:id', rbac('superadmin'), userController.deleteUser);

module.exports = router;
