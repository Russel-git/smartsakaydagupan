const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    type: { type: String, enum: ['fare_update', 'weather_alert', 'complaint_update', 'system', 'broadcast'], required: true },
    category: {
      type: String,
      trim: true,
      default: function () {
        if (this.type === 'weather_alert') return 'weather_updates';
        if (this.type === 'complaint_update') return 'complaint_updates';
        return 'broadcast_by_admin';
      },
    },
    isRead: { type: Boolean, default: false },
    readByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedForUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['pending_approval', 'published', 'rejected', 'archived'],
      default: 'published',
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'lgu', 'poso', 'system'],
      default: 'admin',
    },
    authorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '', trim: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical', 'advisory'],
      default: 'info',
    },
    locationArea: { type: String, default: '', trim: true },
    municipality: {
      type: String,
      trim: true,
      default: 'Dagupan',
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: {
      type: Date,
      default: function () {
        // Weather updates automatically expire and get deleted after 3 days (72 hours)
        if (this.type === 'weather_alert' || this.category === 'weather_updates') {
          return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        }
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      },
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ category: 1, createdAt: -1 });
notificationSchema.index({ municipality: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
