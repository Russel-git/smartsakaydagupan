const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['registration', 'password_reset', 'login'], required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  attempts: { type: Number, default: 0 },
  registrationData: {
    firstName: { type: String },
    lastName: { type: String },
    suffix: { type: String, default: '' },
    password: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

otpSchema.pre('save', async function () {
  if (!this.isModified('code')) return;
  const salt = await bcrypt.genSalt(10);
  this.code = await bcrypt.hash(this.code, salt);
});

otpSchema.methods.compareCode = async function (candidateCode) {
  return bcrypt.compare(candidateCode, this.code);
};

module.exports = mongoose.model('Otp', otpSchema);
