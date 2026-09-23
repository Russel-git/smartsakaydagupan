const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createComplaintSchema, updateComplaintStatusSchema, addAdminNotesSchema } = require('../validators/complaintValidator');

router.use(authMiddleware);
router.post('/', rbac('commuter'), validate(createComplaintSchema), complaintController.createComplaint);
router.get('/my', rbac('commuter'), complaintController.getMyComplaints);
router.get('/:id', rbac('commuter', 'admin'), complaintController.getComplaintById);
router.get('/', rbac('admin'), complaintController.getAllComplaints);
router.put('/:id/status', rbac('admin'), validate(updateComplaintStatusSchema), complaintController.updateComplaintStatus);
router.put('/:id/notes', rbac('admin'), validate(addAdminNotesSchema), complaintController.addAdminNotes);

module.exports = router;
