const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: [true, 'Title is required'], trim: true },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    type: { type: String, enum: ['fare_update', 'weather_alert', 'complaint_update', 'system', 'broadcast'], required: true },
    category: {
      type: String,
      enum: ['weather_updates', 'complaint_updates', 'broadcast_by_admin'],
      default: function () {
        if (this.type === 'weather_alert') return 'weather_updates';
        if (this.type === 'complaint_update') return 'complaint_updates';
        return 'broadcast_by_admin';
      },
    },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
