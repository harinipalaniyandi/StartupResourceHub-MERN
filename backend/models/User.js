const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['founder', 'mentor', 'admin'], default: 'founder' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // ==========================================
  // 1. COMPLETE FOUNDER STARTUP PROFILE
  // ==========================================
  startupName: { type: String, default: '' },
  businessDomain: { type: String, default: '' }, // e.g. Fintech, AgriTech, HealthTech, E-commerce, EdTech, SaaS
  startupStage: {
    type: String,
    enum: ['idea', 'mvp', 'early_revenue', 'scaling', null, ''],
    default: 'idea'
  },
  location: { type: String, default: '' }, // e.g. Tamil Nadu, Bangalore, Remote
  problem: { type: String, default: '' }, // Problem the startup solves
  productService: { type: String, default: '' }, // Description of product or service
  mvpStatus: {
    type: String,
    enum: ['not_started', 'in_development', 'mvp_ready', 'live_with_users', ''],
    default: 'not_started'
  },
  teamSize: { type: String, default: '1-5' }, // e.g. 1, 2-5, 6-10, 10+
  targetCustomers: { type: String, default: 'B2B' }, // B2B, B2C, B2B2C, D2C, Enterprise
  marketValidation: {
    type: String,
    enum: ['none', 'surveys_done', 'pilot_users', 'paying_customers', 'loi_signed', ''],
    default: 'none'
  },
  revenueStatus: {
    type: String,
    enum: ['pre_revenue', 'early_revenue', 'profitable', 'break_even', ''],
    default: 'pre_revenue'
  },
  businessRegistration: {
    type: String,
    enum: ['unregistered', 'sole_proprietorship', 'partnership', 'llp', 'private_limited', 'other', ''],
    default: 'unregistered'
  },
  fundingRequirement: {
    type: String,
    enum: ['none', 'bootstrapped', 'pre_seed', 'seed', 'series_a', 'grant_seeking', ''],
    default: 'none'
  },
  fundingStage: {
    type: String,
    enum: ['bootstrapped', 'seeking_grants', 'seeking_angels', 'seeking_vc', 'funded', ''],
    default: 'bootstrapped'
  },
  requiredExpertise: { type: String, default: '' }, // e.g. fundraising, marketing, legal, technical architecture
  currentChallenges: { type: String, default: '' }, // Key bottlenecks / challenges
  startupGoals: { type: String, default: '' }, // 6-12 month goals
  needs: { type: String, default: '' }, // comma separated keywords for backwards compatibility
  industry: { type: String, default: '' }, // alias/synonym for businessDomain

  // ==========================================
  // 2. COMPLETE MENTOR PROFILE
  // ==========================================
  expertise: { type: String, default: '' }, // comma-separated skills/expertise
  mentorDomain: { type: String, default: '' }, // Primary domains mentored
  experienceYears: { type: Number, default: 0 },
  company: { type: String, default: '' },
  linkedinProfile: { type: String, default: '' },
  supportedStages: { type: String, default: 'idea,mvp,early_revenue' }, // comma-separated
  mentorshipFocus: { type: String, default: '' },
  availability: {
    type: String,
    enum: ['available', 'limited', 'unavailable'],
    default: 'available'
  },
  bio: { type: String, default: '' },

  // Mentor verification
  isMentorVerified: { type: Boolean, default: false },
  mentorVerifiedAt: { type: Date },
  mentorRejectionReason: { type: String, default: '' },
  verificationScore: { type: Number, default: 0 },
  verificationReferences: [
    {
      name: String,
      email: String,
      relationship: String
    }
  ]
}, { timestamps: true });

// Sync industry & businessDomain before saving
userSchema.pre('save', function(next) {
  if (this.businessDomain && !this.industry) {
    this.industry = this.businessDomain;
  } else if (this.industry && !this.businessDomain) {
    this.businessDomain = this.industry;
  }
  next();
});

// Indexes
userSchema.index({ role: 1, isVerified: 1 });
userSchema.index({ isMentorVerified: 1 });
userSchema.index({ businessDomain: 1, startupStage: 1 });

module.exports = mongoose.model('User', userSchema);
