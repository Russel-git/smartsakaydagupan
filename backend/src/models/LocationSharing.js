const mongoose = require("mongoose");

const locationSharingSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
      index: true,
    },
    // Allows either peer to toggle location sharing ON/OFF at will
    isRequesterSharing: {
      type: Boolean,
      default: true,
    },
    isRecipientSharing: {
      type: Boolean,
      default: true,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requesterLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    recipientLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness between user pairs
locationSharingSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.model("LocationSharing", locationSharingSchema);
