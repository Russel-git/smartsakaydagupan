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
    const { page = 1, limit = 50, status, tab = 'all', search } = req.query;
    const filter = { userId: req.user._id };

    if (tab === 'active') {
      filter.status = { $in: ['pending', 'under_review', 'endorsed_to_lgu'] };
      filter.isArchived = { $ne: true };
    } else if (tab === 'resolved') {
      filter.status = { $in: ['action_taken', 'terminated', 'resolved', 'dismissed'] };
      filter.isArchived = { $ne: true };
    } else if (tab === 'archived') {
      filter.isArchived = true;
      filter.status = { $ne: 'deleted' };
    } else if (tab === 'deleted') {
      filter.status = 'deleted';
    } else {
      // tab === 'all'
      filter.status = { $ne: 'deleted' };
      filter.isArchived = { $ne: true };
      if (status) filter.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { subject: regex },
        { lguCaseNumber: regex },
        { vehiclePlateNumber: regex },
        { category: regex },
      ];
    }

    const [totalAll, totalActive, totalResolved, totalArchived, totalDeleted] = await Promise.all([
      Complaint.countDocuments({ userId: req.user._id, status: { $ne: 'deleted' }, isArchived: { $ne: true } }),
      Complaint.countDocuments({
        userId: req.user._id,
        status: { $in: ['pending', 'under_review', 'endorsed_to_lgu'] },
        isArchived: { $ne: true },
      }),
      Complaint.countDocuments({
        userId: req.user._id,
        status: { $in: ['action_taken', 'terminated', 'resolved', 'dismissed'] },
        isArchived: { $ne: true },
      }),
      Complaint.countDocuments({ userId: req.user._id, isArchived: true, status: { $ne: 'deleted' } }),
      Complaint.countDocuments({ userId: req.user._id, status: 'deleted' }),
    ]);

    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('routeId', 'name')
      .populate('verifiedBy', 'firstName lastName')
      .populate('lguHandledBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Complaints retrieved successfully',
      data: complaints,
      counts: {
        all: totalAll,
        active: totalActive,
        resolved: totalResolved,
        archived: totalArchived,
        deleted: totalDeleted,
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
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

    if (complaint.userId) {
      const statusLabels = {
        pending: 'Pending',
        under_review: 'Under Review',
        endorsed_to_lgu: 'Endorsed to Dagupan LGU',
        action_taken: 'Action Taken by LGU',
        terminated: 'Resolved & Closed',
        resolved: 'Resolved',
        dismissed: 'Dismissed',
      };
      const label = statusLabels[status] || status;
      await Notification.create({
        userId: complaint.userId._id || complaint.userId,
        title: `📋 Complaint Status: ${label}`,
        message: `Your complaint "${complaint.subject}" was updated to ${label}.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
        type: 'complaint_update',
        metadata: {
          complaintId: complaint._id,
          status: complaint.status,
          lguCaseNumber: complaint.lguCaseNumber,
        },
      });
    }

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

    if (complaint.userId) {
      await Notification.create({
        userId: complaint.userId,
        title: '💬 Officer Note on Your Report',
        message: `An update note was added to your report "${complaint.subject}": ${adminNotes}`,
        type: 'complaint_update',
        metadata: {
          complaintId: complaint._id,
          status: complaint.status,
          lguCaseNumber: complaint.lguCaseNumber,
        },
      });
    }

    return apiResponse.success(res, complaint, 'Admin notes added');
  } catch (error) { next(error); }
};

// Commuter self-management: Edit, Archive, Delete & Undo
const updateMyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized to edit this complaint', 403);
    }

    if (complaint.isArchived) {
      return apiResponse.error(res, 'Cannot edit an archived report. Please unarchive it first.', 400);
    }

    if (complaint.status === 'deleted') {
      return apiResponse.error(res, 'Cannot edit a deleted report.', 400);
    }

    // Only allow editing while In Progress (pending or under_review)
    if (!['pending', 'under_review'].includes(complaint.status)) {
      return apiResponse.error(
        res,
        'Reports can only be edited while In Progress (before official LGU endorsement or action).',
        400
      );
    }

    const { category, subject, description, routeId, vehiclePlateNumber, attachments, location } = req.body;
    if (category) complaint.category = category;
    if (subject) complaint.subject = subject.trim();
    if (description) complaint.description = description.trim();
    if (routeId !== undefined) complaint.routeId = routeId || null;
    if (vehiclePlateNumber !== undefined) complaint.vehiclePlateNumber = vehiclePlateNumber.trim();
    if (attachments !== undefined) complaint.attachments = attachments;
    if (location !== undefined) complaint.location = location;

    await complaint.save();

    await logAuditEvent(req, {
      action: 'COMMUTER_COMPLAINT_EDITED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { subject: complaint.subject },
    });

    return apiResponse.success(res, complaint, 'Report updated successfully');
  } catch (error) { next(error); }
};

const archiveMyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized to archive this report', 403);
    }

    if (complaint.status === 'deleted') {
      return apiResponse.error(res, 'Cannot archive a deleted report.', 400);
    }

    complaint.isArchived = true;
    complaint.archivedAt = new Date();
    await complaint.save();

    await logAuditEvent(req, {
      action: 'COMMUTER_COMPLAINT_ARCHIVED',
      resourceType: 'complaint',
      resourceId: complaint._id,
    });

    return apiResponse.success(res, complaint, 'Report archived successfully');
  } catch (error) { next(error); }
};

const unarchiveMyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized to unarchive this report', 403);
    }

    complaint.isArchived = false;
    complaint.archivedAt = null;
    await complaint.save();

    await logAuditEvent(req, {
      action: 'COMMUTER_COMPLAINT_UNARCHIVED',
      resourceType: 'complaint',
      resourceId: complaint._id,
    });

    return apiResponse.success(res, complaint, 'Report restored from archive');
  } catch (error) { next(error); }
};

const deleteMyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized to delete this report', 403);
    }

    complaint.previousStatus = complaint.status;
    complaint.status = 'deleted';
    complaint.deletedBy = req.user._id;
    complaint.deletedAt = new Date();
    complaint.deletionReason = 'Deleted by Commuter';
    complaint.deletionNotes = req.body?.notes || 'Commuter requested removal/cancellation';
    await complaint.save();

    await logAuditEvent(req, {
      action: 'COMMUTER_COMPLAINT_DELETED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { previousStatus: complaint.previousStatus },
    });

    return apiResponse.success(res, complaint, 'Report deleted successfully');
  } catch (error) { next(error); }
};

const undoMyComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return apiResponse.error(res, 'Not authorized to undo/restore this report', 403);
    }

    let actionTaken = '';
    if (complaint.status === 'deleted') {
      complaint.status = complaint.previousStatus || 'pending';
      complaint.deletedBy = null;
      complaint.deletedAt = null;
      complaint.deletionReason = '';
      complaint.deletionNotes = '';
      actionTaken = 'Restored from deleted';
    } else if (complaint.isArchived) {
      complaint.isArchived = false;
      complaint.archivedAt = null;
      actionTaken = 'Restored from archive';
    } else {
      actionTaken = 'Report is active';
    }

    await complaint.save();

    await logAuditEvent(req, {
      action: 'COMMUTER_COMPLAINT_RESTORED',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: { action: actionTaken },
    });

    return apiResponse.success(res, complaint, `Report restored successfully (${actionTaken})`);
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
  updateMyComplaint,
  archiveMyComplaint,
  unarchiveMyComplaint,
  deleteMyComplaint,
  undoMyComplaint,
};
