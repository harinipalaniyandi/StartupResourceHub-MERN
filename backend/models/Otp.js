const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  otpCode: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['verification', 'password_reset'],
    default: 'verification'
  },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false },
  lastSentAt: { type: Date, default: Date.now }
}, { timestamps: true });

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model('Otp', otpSchema);
