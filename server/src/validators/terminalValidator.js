const Joi = require('joi');

const createTerminalSchema = Joi.object({
  name: Joi.string().trim().min(3).max(150).required(),
  company: Joi.string().trim().allow('').max(150),
  type: Joi.string().valid('bus', 'jeepney', 'tricycle', 'multimodal').required(),
  address: Joi.string().trim().min(3).max(250).required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  contactNumber: Joi.string().trim().allow('').max(100),
  operatingHours: Joi.string().trim().allow('').max(100),
  destinations: Joi.array().items(Joi.string().trim().max(100)).default([]),
  amenities: Joi.array().items(Joi.string().trim().max(100)).default([]),
  description: Joi.string().trim().allow('').max(2000),
  isActive: Joi.boolean().default(true),
});

const updateTerminalSchema = Joi.object({
  name: Joi.string().trim().min(3).max(150),
  company: Joi.string().trim().allow('').max(150),
  type: Joi.string().valid('bus', 'jeepney', 'tricycle', 'multimodal'),
  address: Joi.string().trim().min(3).max(250),
  lat: Joi.number().min(-90).max(90),
  lng: Joi.number().min(-180).max(180),
  contactNumber: Joi.string().trim().allow('').max(100),
  operatingHours: Joi.string().trim().allow('').max(100),
  destinations: Joi.array().items(Joi.string().trim().max(100)),
  amenities: Joi.array().items(Joi.string().trim().max(100)),
  description: Joi.string().trim().allow('').max(2000),
  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createTerminalSchema,
  updateTerminalSchema,
};
