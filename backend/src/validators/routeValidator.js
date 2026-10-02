const Joi = require('joi');

const pointSchema = Joi.object({
  name: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

const waypointSchema = Joi.object({
  name: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  order: Joi.number().integer().min(0).required(),
});

const createRouteSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  code: Joi.string().trim().uppercase().required(),
  category: Joi.string().valid('city', 'intercity').required(),
  description: Joi.string().allow('').default(''),
  corridor: Joi.string().allow('').default(''),
  distanceKm: Joi.number().positive().required(),
  startPoint: pointSchema.optional(),
  endPoint: pointSchema.optional(),
  path: Joi.array().items(Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() })).default([]),
  waypoints: Joi.array().items(waypointSchema).default([]),
  isLoop: Joi.boolean().default(true),
  terminalLocation: Joi.object({
    name: Joi.string(), address: Joi.string(), lat: Joi.number(), lng: Joi.number(),
  }),
  operatingHours: Joi.object({
    start: Joi.string().pattern(/^\d{2}:\d{2}$/),
    end: Joi.string().pattern(/^\d{2}:\d{2}$/),
  }),
});

const updateRouteSchema = createRouteSchema.fork(
  ['name', 'code', 'category', 'distanceKm'],
  (field) => field.optional()
);


module.exports = { createRouteSchema, updateRouteSchema };
