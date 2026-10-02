const mongoose = require('mongoose');

const fareSchema = new mongoose.Schema(
  {
    vehicleType: { type: String, enum: ['traditional', 'modern', 'tricycle'], required: true },
    baseFare: { type: Number, required: [true, 'Base fare is required'] },
    baseDistanceKm: { type: Number, required: true, default: 4 },
    perKmRate: { type: Number, required: [true, 'Per km rate is required'] },
    discounts: {
      student: { type: Number, default: 0.20 },
      seniorCitizen: { type: Number, default: 0.20 },
      pwd: { type: Number, default: 0.20 },
    },
    effectiveDate: { type: Date, required: true },
    memorandumRef: { type: String, default: '' },
    source: { type: String, default: 'LTFRB' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fare', fareSchema);
