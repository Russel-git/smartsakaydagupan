const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const apiResponse = require('../utils/apiResponse');
const { logAuditEvent } = require('../utils/auditLogger');


const createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({ ...req.body, userId: req.user._id });
    return apiResponse.success(res, complaint, 'Complaint submitted successfully', 201);
  } catch (error) { next(error); }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.user._id };
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
      .populate('resolvedBy', 'firstName lastName');
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
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .populate('userId', 'firstName lastName email').populate('routeId', 'name')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return apiResponse.paginated(res, complaints, total, page, limit);
  } catch (error) { next(error); }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, ltfrbCaseNumber, ltfrbNotes } = req.body;
    const updates = { status };

    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }

    let caseNum = ltfrbCaseNumber;
    if (status === 'endorsed_to_ltfrb') {
      updates.ltfrbEndorsedAt = new Date();
      if (!caseNum || !caseNum.trim()) {
        const year = new Date().getFullYear();
        const randHex = req.params.id.toString().slice(-6).toUpperCase();
        caseNum = `LTFRB-R1-DAG-${year}-${randHex}`;
      }
      updates.ltfrbCaseNumber = caseNum.trim();
      if (ltfrbNotes !== undefined) updates.ltfrbNotes = ltfrbNotes;
    } else if (status === 'resolved' || status === 'dismissed') {
      updates.resolvedBy = req.user._id;
      updates.resolvedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('routeId', 'name');

    if (!complaint) return apiResponse.error(res, 'Complaint not found', 404);

    let notifTitle = 'Complaint Update';
    let notifMessage = `Your complaint "${complaint.subject}" status is now: ${status.replace(/_/g, ' ')}.`;

    if (status === 'endorsed_to_ltfrb') {
      notifTitle = '🏛️ Endorsed to LTFRB Region 1';
      notifMessage = `Your complaint "${complaint.subject}" has been verified by Dagupan City Admin and officially endorsed to LTFRB (Region 1 / Dagupan POSO). Case Tracking No: ${complaint.ltfrbCaseNumber}.`;
      if (complaint.ltfrbNotes) {
        notifMessage += ` Advisory: ${complaint.ltfrbNotes}`;
      }
    } else if (status === 'resolved') {
      notifTitle = '✅ Complaint Resolved';
      notifMessage = `Your complaint "${complaint.subject}" has been resolved by transport authorities.`;
    }

    await Notification.create({
      userId: complaint.userId._id || complaint.userId,
      title: notifTitle,
      message: notifMessage,
      type: 'complaint_update',
      metadata: {
        complaintId: complaint._id,
        status: complaint.status,
        ltfrbCaseNumber: complaint.ltfrbCaseNumber || null,
      },
    });

    await logAuditEvent(req, {
      action: status === 'endorsed_to_ltfrb' ? 'COMPLAINT_ENDORSED_LTFRB' : 'COMPLAINT_STATUS_UPDATE',
      resourceType: 'complaint',
      resourceId: complaint._id,
      details: {
        subject: complaint.subject,
        newStatus: status,
        ltfrbCaseNumber: complaint.ltfrbCaseNumber,
      },
    });

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

module.exports = { createComplaint, getMyComplaints, getComplaintById, getAllComplaints, updateComplaintStatus, addAdminNotes };
