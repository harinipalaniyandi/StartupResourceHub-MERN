const User = require('../models/User');

// GET /api/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile', error: err.message });
  }
};

// PUT /api/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'startupName',
      'businessDomain',
      'industry',
      'startupStage',
      'location',
      'problem',
      'productService',
      'mvpStatus',
      'teamSize',
      'targetCustomers',
      'marketValidation',
      'revenueStatus',
      'businessRegistration',
      'fundingRequirement',
      'fundingStage',
      'requiredExpertise',
      'currentChallenges',
      'startupGoals',
      'needs',
      // Mentor fields
      'expertise',
      'mentorDomain',
      'experienceYears',
      'company',
      'linkedinProfile',
      'supportedStages',
      'mentorshipFocus',
      'availability',
      'bio'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.businessDomain && !updates.industry) {
      updates.industry = updates.businessDomain;
    } else if (updates.industry && !updates.businessDomain) {
      updates.businessDomain = updates.industry;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(400).json({ message: 'Failed to update profile', error: err.message });
  }
};
