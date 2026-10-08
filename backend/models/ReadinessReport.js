const mongoose = require('mongoose');

const dimensionSchema = new mongoose.Schema({
  score: { type: Number, default: 0 }, // 0 to 100
  status: { type: String, default: 'Needs Attention' }, // 'Strong', 'Moderate', 'Needs Attention', 'Critical Gap'
  missingInfo: [{ type: String }],
  gaps: [{ type: String }],
  recommendedActions: [{ type: String }],
  category: { type: String, default: '' }
}, { _id: false });

const opportunityGapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  urgency: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'high' },
  whatStartupHas: { type: String, default: '' },
  whatIsMissing: { type: String, default: '' },
  recommendedAction: { type: String, default: '' },
  linkedResources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }]
}, { _id: false });

const readinessReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  overallScore: { type: Number, default: 0 },
  readinessLevel: { type: String, default: 'Early Stage' }, // 'Idea/Early Validation', 'MVP Ready', 'Market Traction', 'Investment Ready'
  dimensions: {
    productReadiness: { type: dimensionSchema, default: () => ({}) },
    marketReadiness: { type: dimensionSchema, default: () => ({}) },
    businessModelReadiness: { type: dimensionSchema, default: () => ({}) },
    teamReadiness: { type: dimensionSchema, default: () => ({}) },
    legalReadiness: { type: dimensionSchema, default: () => ({}) },
    financialReadiness: { type: dimensionSchema, default: () => ({}) },
    fundingReadiness: { type: dimensionSchema, default: () => ({}) },
    technologyReadiness: { type: dimensionSchema, default: () => ({}) }
  },
  opportunityGaps: [opportunityGapSchema],
  aiInsights: [{ type: String }],
  lastAnalyzedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ReadinessReport', readinessReportSchema);
