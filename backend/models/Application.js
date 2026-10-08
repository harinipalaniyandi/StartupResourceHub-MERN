const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  status: {
    type: String,
    enum: ['saved', 'interested', 'preparing', 'applied', 'under_review', 'accepted', 'rejected'],
    default: 'saved'
  },
  notes: { type: String, default: '' },
  appliedAt: { type: Date },
  deadline: { type: Date },
  checklist: [
    {
      task: { type: String, required: true },
      completed: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

applicationSchema.index({ user: 1, resource: 1 }, { unique: true });
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, deadline: 1 });

module.exports = mongoose.model('Application', applicationSchema);
