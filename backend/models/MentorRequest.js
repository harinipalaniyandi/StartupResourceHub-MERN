const mongoose = require('mongoose');

const mentorRequestSchema = new mongoose.Schema({
  founder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'completed'],
    default: 'pending'
  },
  // Snapshot of founder's context at request time
  startupContext: {
    startupName: { type: String, default: '' },
    startupStage: { type: String, default: '' },
    businessDomain: { type: String, default: '' },
    currentChallenges: { type: String, default: '' },
    problem: { type: String, default: '' }
  },
  mentorNotes: { type: String, default: '' },
  meetingDetails: { type: String, default: '' },
  respondedAt: { type: Date }
}, { timestamps: true });

mentorRequestSchema.index({ founder: 1, mentor: 1, status: 1 });
mentorRequestSchema.index({ mentor: 1, status: 1 });
mentorRequestSchema.index({ founder: 1, status: 1 });

module.exports = mongoose.model('MentorRequest', mentorRequestSchema);
