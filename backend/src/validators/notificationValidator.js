const Joi = require('joi');

const broadcastSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  message: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().valid('fare_update', 'weather_alert', 'system', 'broadcast').default('broadcast'),
});

const sendToUserSchema = Joi.object({
  userId: Joi.string().required(),
  title: Joi.string().trim().min(1).max(200).required(),
  message: Joi.string().trim().min(1).max(1000).required(),
  type: Joi.string().valid('fare_update', 'weather_alert', 'complaint_update', 'system', 'broadcast').default('system'),
});

module.exports = { broadcastSchema, sendToUserSchema };
