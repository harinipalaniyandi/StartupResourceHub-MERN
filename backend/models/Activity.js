const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
  action: {
    type: String,
    enum: ['view', 'click', 'save', 'apply', 'search'],
    default: 'view'
  },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

activitySchema.index({ user: 1, action: 1, createdAt: -1 });
activitySchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('Activity', activitySchema);
