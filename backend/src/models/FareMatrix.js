const mongoose = require('mongoose');

const fareMatrixSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    fareId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fare', required: true },
    vehicleType: { type: String, enum: ['traditional', 'modern', 'tricycle'], required: true },
    regularFare: { type: Number, required: true },
    discountedFare: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

fareMatrixSchema.index({ routeId: 1, vehicleType: 1, isActive: 1 });

module.exports = mongoose.model('FareMatrix', fareMatrixSchema);
