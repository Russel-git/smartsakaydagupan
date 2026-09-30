const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  { name: { type: String, default: '' }, lat: { type: Number }, lng: { type: Number } },
  { _id: false }
);

const waypointSchema = new mongoose.Schema(
  { name: { type: String, required: true }, lat: { type: Number, required: true }, lng: { type: Number, required: true }, order: { type: Number, required: true } },
  { _id: false }
);

const pathPointSchema = new mongoose.Schema(
  { lat: { type: Number, required: true }, lng: { type: Number, required: true } },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Route name is required'], trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    category: { type: String, enum: ['city', 'intercity'], required: true },
    description: { type: String, default: '' },
    corridor: { type: String, default: '' },
    distanceKm: { type: Number, required: [true, 'Distance is required'] },
    startPoint: { type: pointSchema, required: false },
    endPoint: { type: pointSchema, required: false },
    path: [pathPointSchema],
    waypoints: [waypointSchema],
    isLoop: { type: Boolean, default: true },
    terminalLocation: {
      name: { type: String },
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
    },
    operatingHours: {
      start: { type: String, default: '04:00' },
      end: { type: String, default: '21:00' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);

