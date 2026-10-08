const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: [
      'Funding',
      'Government Scheme',
      'Mentor',
      'Tool/Software',
      'Co-working Space',
      'Legal/Compliance',
      'Incubator/Accelerator'
    ]
  },
  tags: { type: String, default: '' }, // comma-separated
  industryFocus: { type: String, default: 'all' }, // e.g. "fintech,agritech" or "all"
  stageFocus: { type: String, default: 'all' }, // comma-separated e.g. "idea,mvp" or "all"
  location: { type: String, default: 'all' },
  budgetRange: { type: String, default: '' },
  externalLink: { type: String, default: '' },
  fundingType: { type: String, default: '' }, // Grant, Equity, Debt, Credits, Mentorship

  // Smart Deadline & Application Details
  deadline: { type: Date },
  deadlineType: {
    type: String,
    enum: ['fixed', 'rolling', 'closed'],
    default: 'rolling'
  },
  eligibilityCriteria: { type: String, default: '' },
  requiredDocuments: [{ type: String }], // e.g. Pitch deck, GST, DPIIT, Business Plan
  targetUsers: { type: String, default: 'Founders' },

  viewCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ========== APPROVAL & METADATA REVIEW ==========
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  approvalNotes: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  lastReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastReviewedAt: { type: Date },

  // ========== VERIFICATION & QUALITY ==========
  verificationStatus: {
    type: String,
    enum: ['verified', 'flagged', 'needs_review'],
    default: 'verified'
  },
  verificationNotes: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  lastVerifiedWorking: { type: Date },
  isBrokenLink: { type: Boolean, default: false }

}, { timestamps: true });

// Text index for full-text search
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  industryFocus: 'text',
  eligibilityCriteria: 'text'
});

// Compound indexes for query performance
resourceSchema.index({ status: 1, verificationStatus: 1, isActive: 1 });
resourceSchema.index({ category: 1, stageFocus: 1, industryFocus: 1 });
resourceSchema.index({ deadline: 1 });
resourceSchema.index({ createdAt: -1 });
resourceSchema.index({ viewCount: -1 });

module.exports = mongoose.model('Resource', resourceSchema);
