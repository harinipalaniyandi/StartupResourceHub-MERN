const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Notification' },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'resource',
      'mentor',
      'message',
      'application',
      'deadline',
      'roadmap',
      'opportunity',
      'system',
      'announcement',
      'resource_approval',
      'mentor_verification'
    ],
    default: 'system'
  },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
