const Joi = require('joi');

const broadcastSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  message: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().valid('fare_update', 'weather_alert', 'complaint_update', 'system', 'broadcast').default('broadcast'),
  category: Joi.string().allow('', null),
  severity: Joi.string().valid('info', 'warning', 'critical', 'advisory').default('info'),
  priority: Joi.string().allow('', null),
  location: Joi.string().allow('', null).max(200),
  locationArea: Joi.string().allow('', null).max(200),
  municipality: Joi.string().allow('', null).max(100),
  photoUrl: Joi.string().allow('', null).max(1000),
  evidencePhoto: Joi.string().allow('', null).max(1000),
  metadata: Joi.object().unknown(true).optional(),
});

const sendToUserSchema = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().trim().min(1).max(200).required(),
  message: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().valid('fare_update', 'weather_alert', 'complaint_update', 'system', 'broadcast').default('system'),
  category: Joi.string().allow('', null),
  severity: Joi.string().valid('info', 'warning', 'critical').default('warning'),
  priority: Joi.string().allow('', null),
  location: Joi.string().allow('', null).max(200),
  locationArea: Joi.string().allow('', null).max(200),
  municipality: Joi.string().allow('', null).max(100),
  photoUrl: Joi.string().allow('', null).max(1000),
  evidencePhoto: Joi.string().allow('', null).max(1000),
  metadata: Joi.object().unknown(true).optional(),
});

const roadAlertRequestSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  message: Joi.string().trim().min(5).max(1000).required(),
  severity: Joi.string().valid('info', 'warning', 'critical', 'advisory').default('warning'),
  priority: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  location: Joi.string().allow('', null).max(200),
  locationArea: Joi.string().allow('', null).max(200),
  municipality: Joi.string().allow('', null).max(100),
  photoUrl: Joi.string().allow('', null).max(1000),
  evidencePhoto: Joi.string().allow('', null).max(1000),
  metadata: Joi.object().unknown(true).optional(),
});

const rejectRoadAlertSchema = Joi.object({
  reason: Joi.string().allow('', null).max(500),
  rejectionReason: Joi.string().allow('', null).max(500),
});

module.exports = {
  broadcastSchema,
  sendToUserSchema,
  roadAlertRequestSchema,
  rejectRoadAlertSchema,
};
