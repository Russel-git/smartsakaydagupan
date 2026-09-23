const Joi = require('joi');

const updateFareSchema = Joi.object({
  baseFare: Joi.number().positive().required(),
  baseDistanceKm: Joi.number().positive().required(),
  perKmRate: Joi.number().positive().required(),
  effectiveDate: Joi.date().iso(),
  memorandumRef: Joi.string().allow(''),
  discounts: Joi.object({
    student: Joi.number().min(0).max(1),
    seniorCitizen: Joi.number().min(0).max(1),
    pwd: Joi.number().min(0).max(1),
  }),
});

const calculateFareSchema = Joi.object({
  routeId: Joi.string(),
  distanceKm: Joi.number().positive(),
  vehicleType: Joi.string().valid('traditional', 'modern', 'tricycle').required(),
  discountType: Joi.string().valid('student', 'senior', 'pwd', 'none', 'discounted').default('none'),
}).xor('routeId', 'distanceKm');

module.exports = { updateFareSchema, calculateFareSchema };
