const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'bot'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    language: {
      type: String,
      default: 'auto'
    },
    matches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
      }
    ],
    matchedResourcesData: [mongoose.Schema.Types.Mixed],
    matchedMentorsData: [mongoose.Schema.Types.Mixed],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'Funding', 'Mentor', 'Readiness', 'Roadmap', 'Business Plan', 'Legal', 'Incubator'],
      default: 'General'
    },
    language: {
      type: String,
      enum: ['auto', 'en', 'ta', 'tanglish'],
      default: 'auto'
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

// Index for fast search by user & updated date
conversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
