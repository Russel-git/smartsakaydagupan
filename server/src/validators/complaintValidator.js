const Joi = require('joi');

const createComplaintSchema = Joi.object({
  category: Joi.string()
    .valid('overcharging', 'reckless_driving', 'harassment', 'route_deviation', 'vehicle_condition', 'other')
    .required(),
  subject: Joi.string().trim().min(5).max(200).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  routeId: Joi.string().allow(null, ''),
  vehiclePlateNumber: Joi.string().allow('').max(20),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
    address: Joi.string().allow(''),
  }),
  attachments: Joi.array().items(Joi.string()).max(3),
});

const updateComplaintStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'pending',
      'under_review',
      'endorsed_to_lgu',
      'action_taken',
      'terminated',
      'deleted',
      'endorsed_to_ltfrb',
      'resolved',
      'dismissed'
    )
    .required(),
  adminNotes: Joi.string().allow('', null).max(2000),
  lguCaseNumber: Joi.string().allow('', null).max(100),
  lguActionNotes: Joi.string().allow('', null).max(2000),
  ltfrbCaseNumber: Joi.string().allow('', null).max(100),
  ltfrbNotes: Joi.string().allow('', null).max(2000),
});

const deleteComplaintSchema = Joi.object({
  deletionReason: Joi.string()
    .valid(
      'Spam / False Information',
      'Duplicate Complaint',
      'Inappropriate / Abusive Content',
      'Insufficient Evidence / Details',
      'Resolved Informally',
      'Other'
    )
    .required(),
  deletionNotes: Joi.string().allow('', null).max(1000),
});

const lguActionSchema = Joi.object({
  lguActionNotes: Joi.string().trim().min(3).max(2000).required(),
});

const lguTerminateSchema = Joi.object({
  lguTerminationNotes: Joi.string().allow('', null).max(2000),
});

const endorseComplaintSchema = Joi.object({
  ltfrbCaseNumber: Joi.string().trim().max(100).allow(''),
  ltfrbNotes: Joi.string().trim().max(2000).allow(''),
  adminNotes: Joi.string().trim().max(2000).allow(''),
});

const addAdminNotesSchema = Joi.object({
  adminNotes: Joi.string().trim().min(1).max(2000).required(),
});

module.exports = {
  createComplaintSchema,
  updateComplaintStatusSchema,
  deleteComplaintSchema,
  lguActionSchema,
  lguTerminateSchema,
  endorseComplaintSchema,
  addAdminNotesSchema,
};
