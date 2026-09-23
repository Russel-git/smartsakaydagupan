const mongoose = require('mongoose');

const terminalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Terminal name is required'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['bus', 'jeepney', 'tricycle', 'multimodal'],
      default: 'bus',
      required: true,
    },
    address: {
      type: String,
      required: [true, 'Terminal address is required'],
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: '',
    },
    operatingHours: {
      type: String,
      trim: true,
      default: '24/7',
    },
    destinations: [{
      type: String,
      trim: true,
    }],
    amenities: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for geo/listing
terminalSchema.index({ type: 1, isActive: 1 });
terminalSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('Terminal', terminalSchema);
