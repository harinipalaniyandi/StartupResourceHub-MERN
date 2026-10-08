const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  recommendedAction: { type: String, default: '' },
  resourceCategory: { type: String, default: '' },
  linkedResourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }
});

const roadmapStageSchema = new mongoose.Schema({
  stageNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  tasks: [taskSchema]
});

const roadmapSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  startupName: { type: String, default: '' },
  startupStage: { type: String, default: 'idea' },
  businessDomain: { type: String, default: '' },
  overallProgress: { type: Number, default: 0 }, // 0 to 100%
  stages: [roadmapStageSchema],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);
