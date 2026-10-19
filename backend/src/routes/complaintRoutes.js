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
  posoFieldReportSchema,
  posoEndorseSchema,
} = require('../validators/complaintValidator');

router.use(authMiddleware);

// Commuter & Staff evidence upload route
router.post('/upload-photo', rbac('commuter', 'admin', 'lgu', 'poso'), uploadEvidence.single('photo'), complaintController.uploadEvidencePhoto);
router.post('/', rbac('commuter'), validate(createComplaintSchema), complaintController.createComplaint);
router.get('/my', rbac('commuter'), complaintController.getMyComplaints);
router.get('/my-complaints', rbac('commuter'), complaintController.getMyComplaints);
router.put('/my/:id', rbac('commuter'), validate(updateCommuterComplaintSchema), complaintController.updateMyComplaint);
router.put('/my/:id/archive', rbac('commuter'), complaintController.archiveMyComplaint);
router.put('/my/:id/unarchive', rbac('commuter'), complaintController.unarchiveMyComplaint);
router.delete('/my/:id', rbac('commuter'), complaintController.deleteMyComplaint);
router.delete('/my/:id/permanent', rbac('commuter'), complaintController.permanentDeleteComplaint);
router.put('/my/:id/undo', rbac('commuter'), complaintController.undoMyComplaint);

// Monthly Analytics for LGU & POSO
router.get('/analytics/monthly', rbac('admin', 'lgu', 'poso'), complaintController.getMonthlyComplaintAnalytics);

router.get('/:id', rbac('commuter', 'admin', 'lgu', 'poso'), complaintController.getComplaintById);

// Staff / LGU / POSO routes
router.get('/', rbac('admin', 'lgu', 'poso'), complaintController.getAllComplaints);

// POSO Field Enforcement & Triage routes
router.post('/field-report', rbac('poso', 'admin'), validate(posoFieldReportSchema), complaintController.createFieldReport);
router.patch('/:id/endorse', rbac('poso', 'admin'), validate(posoEndorseSchema), complaintController.endorseToLgu);
router.put('/:id/verify-lgu', rbac('poso', 'admin'), complaintController.verifyAndEndorseToLgu);
router.patch('/:id/reject', rbac('poso', 'admin'), complaintController.rejectComplaint);

// LGU Action Desk & Admin Management routes
router.put('/:id/lgu-action', rbac('lgu', 'admin'), validate(lguActionSchema), complaintController.lguTakeAction);
router.put('/:id/lgu-terminate', rbac('lgu', 'admin'), validate(lguTerminateSchema), complaintController.lguTerminate);
router.delete('/:id', rbac('admin', 'lgu'), validate(deleteComplaintSchema), complaintController.deleteComplaintWithReason);
router.patch('/:id/restore', rbac('admin', 'lgu'), complaintController.restoreComplaint);
router.delete('/:id/permanent', rbac('admin', 'lgu', 'commuter'), complaintController.permanentDeleteComplaint);
router.put('/:id/status', rbac('admin', 'lgu'), validate(updateComplaintStatusSchema), complaintController.updateComplaintStatus);
router.put('/:id/notes', rbac('admin', 'lgu', 'poso'), validate(addAdminNotesSchema), complaintController.addAdminNotes);

module.exports = router;
