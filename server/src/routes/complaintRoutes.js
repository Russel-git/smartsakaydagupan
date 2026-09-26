const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authMiddleware } = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { uploadEvidence } = require('../middleware/upload');
const {
  createComplaintSchema,
  updateComplaintStatusSchema,
  deleteComplaintSchema,
  lguActionSchema,
  lguTerminateSchema,
  addAdminNotesSchema,
  updateCommuterComplaintSchema,
} = require('../validators/complaintValidator');

router.use(authMiddleware);

// Commuter routes
router.post('/upload-photo', rbac('commuter'), uploadEvidence.single('photo'), complaintController.uploadEvidencePhoto);
router.post('/', rbac('commuter'), validate(createComplaintSchema), complaintController.createComplaint);
router.get('/my', rbac('commuter'), complaintController.getMyComplaints);
router.put('/my/:id', rbac('commuter'), validate(updateCommuterComplaintSchema), complaintController.updateMyComplaint);
router.put('/my/:id/archive', rbac('commuter'), complaintController.archiveMyComplaint);
router.put('/my/:id/unarchive', rbac('commuter'), complaintController.unarchiveMyComplaint);
router.delete('/my/:id', rbac('commuter'), complaintController.deleteMyComplaint);
router.put('/my/:id/undo', rbac('commuter'), complaintController.undoMyComplaint);
router.get('/:id', rbac('commuter', 'admin', 'lgu', 'superadmin'), complaintController.getComplaintById);

// Staff / Operator / LGU routes
router.get('/', rbac('superadmin', 'admin', 'lgu'), complaintController.getAllComplaints);
router.put('/:id/verify-lgu', rbac('superadmin', 'admin'), complaintController.verifyAndEndorseToLgu);
router.delete('/:id', rbac('superadmin', 'admin'), validate(deleteComplaintSchema), complaintController.deleteComplaintWithReason);
router.put('/:id/lgu-action', rbac('superadmin', 'lgu'), validate(lguActionSchema), complaintController.lguTakeAction);
router.put('/:id/lgu-terminate', rbac('superadmin', 'lgu'), validate(lguTerminateSchema), complaintController.lguTerminate);
router.put('/:id/status', rbac('superadmin', 'admin'), validate(updateComplaintStatusSchema), complaintController.updateComplaintStatus);
router.put('/:id/notes', rbac('superadmin', 'admin'), validate(addAdminNotesSchema), complaintController.addAdminNotes);

module.exports = router;
