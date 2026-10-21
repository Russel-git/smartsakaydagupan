const Joi = require('joi');

const createComplaintSchema = Joi.object({
  category: Joi.string()
    .valid('overcharging', 'reckless_driving', 'harassment', 'route_deviation', 'vehicle_condition', 'other')
    .required()
    .messages({
      'any.required': 'Please select a violation category.',
      'any.only': 'Please select a valid violation category.',
    }),
  subject: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'Subject is required.',
    'string.min': 'Subject must be at least 5 characters long.',
    'string.max': 'Subject cannot exceed 200 characters.',
    'any.required': 'Subject is required.',
  }),
  description: Joi.string().trim().min(10).max(2000).required()
    .custom((value, helpers) => {
      const words = value.trim().split(/\s+/).filter(Boolean);
      if (words.length < 5) {
        return helpers.message('Description must contain at least 5 to 8 words describing what happened.');
      }
      return value;
    })
    .messages({
      'string.empty': 'Description is required.',
      'string.min': 'Description must be at least 10 characters long.',
      'string.max': 'Description cannot exceed 2000 characters.',
      'any.required': 'Description is required.',
    }),
  routeId: Joi.string().allow(null, ''),
  vehiclePlateNumber: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{3}[ -]?[0-9]{3,4}$/i)
    .required()
    .messages({
      'string.empty': 'Vehicle plate number is required.',
      'any.required': 'Vehicle plate number is required.',
      'string.pattern.base': 'Please enter a valid Philippine jeepney plate number (e.g., ABC 123 or ABC 1234).',
    }),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
    address: Joi.string().allow(''),
  }),
  attachments: Joi.array().items(Joi.string()).max(3),
  municipality: Joi.string().trim().max(100).allow('', null),
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
      'dismissed',
      'rejected'
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
  sanctionIssued: Joi.string().allow('', null).max(200),
  lguEvidencePhoto: Joi.string().allow('', null).max(1000),
  evidencePhoto: Joi.string().allow('', null).max(1000),
  notes: Joi.string().allow('', null).max(2000),
}).unknown(true);

const lguTerminateSchema = Joi.object({
  lguTerminationNotes: Joi.string().allow('', null).max(2000),
  resolutionNotes: Joi.string().allow('', null).max(2000),
  sanctionIssued: Joi.string().allow('', null).max(200),
  lguEvidencePhoto: Joi.string().allow('', null).max(1000),
  evidencePhoto: Joi.string().allow('', null).max(1000),
  notes: Joi.string().allow('', null).max(2000),
}).unknown(true);

const posoFieldReportSchema = Joi.object({
  subject: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(5).max(2000).required(),
  category: Joi.string()
    .valid('overcharging', 'reckless_driving', 'harassment', 'route_deviation', 'vehicle_condition', 'other')
    .default('other'),
  vehiclePlateNumber: Joi.string().allow('').max(20),
  routeId: Joi.string().allow(null, ''),
  location: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.object({
      lat: Joi.number().min(-90).max(90),
      lng: Joi.number().min(-180).max(180),
      address: Joi.string().allow(''),
    })
  ),
  attachments: Joi.array().items(Joi.string()).max(5),
  posoEndorsementNotes: Joi.string().allow('', null).max(2000),
  municipality: Joi.string().trim().max(100).allow('', null),
});

const posoEndorseSchema = Joi.object({
  endorsementNotes: Joi.string().allow('', null).max(2000),
  adminNotes: Joi.string().allow('', null).max(2000),
  notes: Joi.string().allow('', null).max(2000),
});

const endorseComplaintSchema = Joi.object({
  ltfrbCaseNumber: Joi.string().trim().max(100).allow(''),
  ltfrbNotes: Joi.string().trim().max(2000).allow(''),
  adminNotes: Joi.string().trim().max(2000).allow(''),
});

const addAdminNotesSchema = Joi.object({
  adminNotes: Joi.string().trim().min(1).max(2000).required(),
});

const updateCommuterComplaintSchema = Joi.object({
  category: Joi.string()
    .valid('overcharging', 'reckless_driving', 'harassment', 'route_deviation', 'vehicle_condition', 'other'),
  subject: Joi.string().trim().min(5).max(200),
  description: Joi.string().trim().min(10).max(2000),
  routeId: Joi.string().allow(null, ''),
  vehiclePlateNumber: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z]{3}[ -]?[0-9]{3,4}$/i)
    .messages({
      'string.pattern.base': 'Please enter a valid Philippine jeepney plate number (e.g., ABC 123 or ABC 1234).',
    }),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
    address: Joi.string().allow(''),
  }),
  attachments: Joi.array().items(Joi.string()).max(3),
});

module.exports = {
  createComplaintSchema,
  updateComplaintStatusSchema,
  deleteComplaintSchema,
  lguActionSchema,
  lguTerminateSchema,
  endorseComplaintSchema,
  addAdminNotesSchema,
  updateCommuterComplaintSchema,
  posoFieldReportSchema,
  posoEndorseSchema,
};
