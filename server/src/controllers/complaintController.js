const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');

const createComplaint = async (req, res, next) => {
  try {
    // Enforce daily 5-report limit per commuter
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const countToday = await Complaint.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: startOfDay },
      status: { $ne: 'deleted' },
    });

    if (countToday >= 5) {
      return apiResponse.error(
        res,
        'Daily report limit reached (5 reports per day). Please wait until tomorrow to submit additional reports.',
        429
      );
    }

    const complaint = await Complaint.create({ ...req.body, userId: req.user._id });
    return apiResponse.success(res, complaint, 'Complaint submitted successfully', 201);
  } catch (error) { next(error); }
};

const uploadEvidencePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return apiResponse.error(res, 'No photo file provided.', 400);
    }
    const fileUrl = `/uploads/complaints/${req.file.filename}`;
    return apiResponse.success(res, { url: fileUrl }, 'Evidence photo uploaded successfully.');
  } catch (error) { next(error); }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.user._id, status: { $ne: 'deleted' } };
    if (status) filter.status = status;
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter).populate('routeId', 'name')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, complaints, total, page, limit);
  } catch (error) { next(error); }
};

const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('routeId', 'name')
      .populate('verifiedBy', 'firstName lastName')
      .populate('lguHandledBy', 'firstName lastName')
      .populate('deletedBy', 'firstName lastName');
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);
    if (req.user.role === 'commuter' && complaint.userId._id.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized', 403);
    }
    return apiResponse.success(res, complaint);
  } catch (error) { next(error); }
};

const getAllComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, startDate, endDate } = req.query;
    const filter = {};

    // LGU role only sees verified complaints forwarded to the city authority
    if (req.user.role === 'lgu') {
      filter.status = status ? status : { $in: ['endorsed_to_lgu', 'action_taken', 'terminated'] };
    } else {
      // Exclude soft-deleted records by default
      if (status) {
        filter.status = status;
      } else {
        filter.status = { $ne: 'deleted' };
      }
    }

    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('routeId', 'name')
      .populate('verifiedBy', 'firstName lastName')
      .populate('lguHandledBy', 'firstName lastName')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, complaints, total, page, limit);
  } catch (error) { next(error); }
};

const verifyAndEndorseToLgu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const complaint = await Complaint.findById(id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found.', 404);

    const year = new Date().getFullYear();
    const randHex = complaint._id.toString().slice(-6).toUpperCase();
    const lguCaseNumber = `LGU-DAG-${year}-${randHex}`;

    complaint.status = 'endorsed_to_lgu';
    complaint.lguCaseNumber = lguCaseNumber;
    complaint.lguEndorsedAt = new Date();
    complaint.verifiedBy = req.user._id;
    if (adminNotes) complaint.adminNotes = adminNotes;
    await complaint.save();

    await Notification.create({
      userId: complaint.userId,
      title: '🏛️ Verified & Endorsed to Dagupan LGU',
      message: `Your complaint "${complaint.subject}" was verified by transit operators and escalated to Dagupan City POSO/LGU. Case Tracking No: ${lguCaseNumber}.`,
      type: 'complaint_update',
      metadata: { complaintId: complaint._id, status: 'endorsed_to_lgu', lguCaseNumber },
    });

    await logAuditEvent(req, {
      action: 'COMPLAINT_VERIFIED_TO_LGU',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, lguCaseNumber },
    });

    return apiResponse.success(res, complaint, 'Complaint verified and forwarded to Dagupan LGU.');
  } catch (error) { next(error); }
};

const deleteComplaintWithReason = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deletionReason, deletionNotes } = req.body;
    const complaint = await Complaint.findById(id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found.', 404);

    complaint.status = 'deleted';
    complaint.deletionReason = deletionReason;
    complaint.deletionNotes = deletionNotes || '';
    complaint.deletedBy = req.user._id;
    complaint.deletedAt = new Date();
    await complaint.save();

    await logAuditEvent(req, {
      action: 'COMPLAINT_SOFT_DELETED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, deletionReason, deletionNotes },
    });

    return apiResponse.success(res, null, 'Complaint report has been removed with reason documented.');
  } catch (error) { next(error); }
};

const lguTakeAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lguActionNotes } = req.body;
    const complaint = await Complaint.findById(id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found.', 404);

    complaint.status = 'action_taken';
    complaint.lguActionNotes = lguActionNotes;
    complaint.lguActionTakenAt = new Date();
    complaint.lguHandledBy = req.user._id;
    await complaint.save();

    await Notification.create({
      userId: complaint.userId,
      title: '🚨 Official Action Taken by LGU',
      message: `Dagupan City POSO/LGU has taken administrative action on your complaint "${complaint.subject}": ${lguActionNotes}`,
      type: 'complaint_update',
      metadata: { complaintId: complaint._id, status: 'action_taken' },
    });

    await logAuditEvent(req, {
      action: 'COMPLAINT_LGU_ACTION',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, lguActionNotes },
    });

    return apiResponse.success(res, complaint, 'Official LGU action recorded.');
  } catch (error) { next(error); }
};

const lguTerminate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lguTerminationNotes } = req.body;
    const complaint = await Complaint.findById(id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found.', 404);

    complaint.status = 'terminated';
    complaint.lguTerminatedAt = new Date();
    complaint.lguTerminationNotes = lguTerminationNotes || '';
    complaint.lguHandledBy = req.user._id;
    await complaint.save();

    await Notification.create({
      userId: complaint.userId,
      title: '✅ Grievance Terminated & Resolved',
      message: `Your complaint "${complaint.subject}" has been officially resolved and terminated by Dagupan City authorities.`,
      type: 'complaint_update',
      metadata: { complaintId: complaint._id, status: 'terminated' },
    });

    await logAuditEvent(req, {
      action: 'COMPLAINT_LGU_TERMINATED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, lguTerminationNotes },
    });

    return apiResponse.success(res, complaint, 'Complaint terminated and marked as officially resolved.');
  } catch (error) { next(error); }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, lguCaseNumber, lguActionNotes } = req.body;
    const updates = { status };

    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (lguCaseNumber !== undefined) updates.lguCaseNumber = lguCaseNumber;
    if (lguActionNotes !== undefined) updates.lguActionNotes = lguActionNotes;

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('routeId', 'name');

    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    return apiResponse.success(res, complaint, 'Complaint status updated successfully');
  } catch (error) { next(error); }
};

const addAdminNotes = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { adminNotes }, { new: true });
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    await logAuditEvent(req, {
      action: 'COMPLAINT_NOTE_ADDED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject, notes: adminNotes },
    });

    return apiResponse.success(res, complaint, 'Admin notes added');
  } catch (error) { next(error); }
};

module.exports = {
  createComplaint,
  uploadEvidencePhoto,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  verifyAndEndorseToLgu,
  deleteComplaintWithReason,
  lguTakeAction,
  lguTerminate,
  updateComplaintStatus,
  addAdminNotes,
};
