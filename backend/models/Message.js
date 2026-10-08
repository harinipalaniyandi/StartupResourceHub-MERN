const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  mentorRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorRequest',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [
    {
      name: { type: String },
      url: { type: String },
      fileType: { type: String }
    }
  ],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

messageSchema.index({ mentorRequest: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('Message', messageSchema);
