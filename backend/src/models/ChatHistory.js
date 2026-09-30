const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

chatHistorySchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
