const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['overcharging', 'reckless_driving', 'harassment', 'route_deviation', 'vehicle_condition', 'other'],
      required: true,
    },
    subject: { type: String, required: [true, 'Subject is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    vehiclePlateNumber: { type: String, default: '', trim: true },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: '' },
    },
    attachments: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'under_review', 'endorsed_to_ltfrb', 'resolved', 'dismissed'],
      default: 'pending',
    },
    adminNotes: { type: String, default: '' },
    ltfrbCaseNumber: { type: String, default: '' },
    ltfrbEndorsedAt: { type: Date, default: null },
    ltfrbNotes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
