const { suggestTags, classifyResource } = require('../services/geminiService');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { rankByQuery } = require('../services/recommendationService');
const { notify, notifyRole } = require('../services/notificationService');

// ============================================================================
// 1. AI-GENERATED RESOURCE METADATA & APPROVAL
// ============================================================================

/**
 * POST /api/admin/suggest-metadata
 * Complete AI auto-classification of resource metadata
 */
exports.suggestMetadataForResource = async (req, res) => {
  try {
    const { title, description, extraInfo } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required for AI classification.' });
    }
    const metadata = await classifyResource(title, description, extraInfo);
    res.json(metadata);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI metadata classification failed', error: err.message });
  }
};

/**
 * POST /api/admin/suggest-tags
 */
exports.suggestTagsForResource = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }
    const tags = await suggestTags(title, description);
    res.json({ tags });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI tag suggestion failed', error: err.message });
  }
};

/**
 * GET /api/admin/resources/pending-approval
 */
exports.getPendingResourceApprovals = async (req, res) => {
  try {
    const pending = await Resource.find({ status: 'pending' })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load pending approvals', error: err.message });
  }
};

/**
 * POST /api/admin/resources/:id/approve
 */
exports.approveResourceMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, feedback } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' });
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    resource.status = newStatus;
    resource.approvalNotes = feedback || '';
    resource.approvedBy = req.user.id;
    resource.approvedAt = new Date();

    await resource.save();

    if (resource.createdBy) {
      await notify(resource.createdBy, {
        title: `Resource ${newStatus === 'approved' ? 'Approved ✅' : 'Needs Changes ⚠️'}`,
        message: `Your resource submission "${resource.title}" was ${newStatus}. ${feedback ? `Note: ${feedback}` : ''}`,
        type: 'resource_approval',
        link: '/admin'
      });
    }

    res.json({ message: `Resource ${newStatus}`, resource });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
};

/**
 * PUT /api/admin/resources/:id/metadata-review
 */
exports.reviewResourceMetadata = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findByIdAndUpdate(
      id,
      {
        ...req.body,
        lastReviewedBy: req.user.id,
        lastReviewedAt: new Date()
      },
      { new: true }
    );

    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ message: 'Metadata updated', resource });
  } catch (err) {
    res.status(500).json({ message: 'Review failed', error: err.message });
  }
};

// ============================================================================
// 2. MENTOR VERIFICATION SYSTEM
// ============================================================================

function calculateMentorVerificationScore(mentor) {
  let score = 0;
  if (mentor.name) score += 20;
  if (mentor.email && (mentor.email.includes('.com') || mentor.email.includes('.in'))) score += 15;
  if (mentor.expertise && mentor.expertise.length > 5) score += 25;
  if (mentor.experienceYears && mentor.experienceYears >= 3) score += 20;
  if (mentor.linkedinProfile) score += 10;
  if (mentor.bio && mentor.bio.length > 20) score += 10;
  return Math.min(score, 100);
}

/**
 * GET /api/admin/mentors/pending-verification
 */
exports.getPendingMentorVerifications = async (req, res) => {
  try {
    const mentors = await User.find({ role: 'mentor', isMentorVerified: false })
      .select('name email mentorDomain expertise experienceYears company linkedinProfile bio createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = mentors.map(m => ({
      ...m,
      verificationScore: calculateMentorVerificationScore(m)
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load mentor verifications', error: err.message });
  }
};

/**
 * POST /api/admin/mentors/:id/verify
 */
exports.verifyMentor = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "verify" or "reject"' });
    }

    const mentor = await User.findById(id);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    if (action === 'verify') {
      mentor.isMentorVerified = true;
      mentor.mentorVerifiedAt = new Date();
      mentor.mentorRejectionReason = '';
    } else {
      mentor.isMentorVerified = false;
      mentor.mentorRejectionReason = reason || 'Verification requirements not met';
    }

    await mentor.save();

    await notify(mentor._id, {
      title: action === 'verify' ? 'Mentor Verification Approved! 🎓' : 'Mentor Application Update',
      message: action === 'verify'
        ? 'Congratulations! Your mentor profile has been verified by the administration.'
        : `Your mentor verification was rejected. Reason: ${reason || 'Incomplete profile'}`,
      type: 'mentor_verification',
      link: '/mentor-dashboard'
    });

    res.json({ message: `Mentor ${action}ed successfully`, mentor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

// ============================================================================
// 3. RESOURCE QUALITY & STATUS
// ============================================================================

exports.getResourceStatusReport = async (req, res) => {
  try {
    const statusBreakdown = await Resource.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byVerification = await Resource.aggregate([
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
    ]);

    const deadLinks = await Resource.find({
      externalLink: { $ne: '' },
      viewCount: 0,
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).select('title externalLink createdAt');

    const totalResources = await Resource.countDocuments();

    res.json({
      statusBreakdown,
      byVerification,
      potentialBrokenLinks: deadLinks,
      totalResources
    });
  } catch (err) {
    res.status(500).json({ message: 'Status report error', error: err.message });
  }
};

exports.updateResourceVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, reason } = req.body;

    const resource = await Resource.findByIdAndUpdate(
      id,
      {
        verificationStatus,
        verificationNotes: reason || '',
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json({ message: 'Verification status updated', resource });
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// ============================================================================
// 4. PLATFORM HEALTH & ANALYTICS
// ============================================================================

exports.getPlatformHealth = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsers24h,
      newUsers7d,
      verifiedUsers,
      founders,
      mentors,
      verifiedMentors,
      totalResources,
      newResources24h,
      approvedResources,
      pendingResources,
      rejectedResources,
      viewsLast24h,
      viewsLast7d
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last24h } }),
      User.countDocuments({ createdAt: { $gte: last7d } }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ role: 'founder' }),
      User.countDocuments({ role: 'mentor' }),
      User.countDocuments({ role: 'mentor', isMentorVerified: true }),
      Resource.countDocuments(),
      Resource.countDocuments({ createdAt: { $gte: last24h } }),
      Resource.countDocuments({ status: 'approved' }),
      Resource.countDocuments({ status: 'pending' }),
      Resource.countDocuments({ status: 'rejected' }),
      Activity.countDocuments({ action: 'view', createdAt: { $gte: last24h } }),
      Activity.countDocuments({ action: 'view', createdAt: { $gte: last7d } })
    ]);

    const activeUsers = await Activity.distinct('user', { createdAt: { $gte: last7d } });
    const engagementRate = totalUsers > 0 ? Math.round((activeUsers.length / totalUsers) * 100) : 0;

    const alerts = [];
    if (pendingResources > 0) alerts.push({ severity: 'warning', message: `${pendingResources} resource submissions awaiting approval.` });
    if (mentors > 0 && verifiedMentors === 0) alerts.push({ severity: 'warning', message: 'Pending mentor applications need review.' });
    if (newResources24h === 0) alerts.push({ severity: 'info', message: 'No new resources added in the last 24 hours.' });

    res.json({
      userMetrics: {
        totalUsers,
        newUsers24h,
        newUsers7d,
        verifiedUsers,
        founders,
        mentors,
        verifiedMentors
      },
      resourceMetrics: {
        totalResources,
        newResources24h,
        approvedResources,
        pendingResources,
        rejectedResources
      },
      activityMetrics: {
        viewsLast24h,
        viewsLast7d,
        activeUsers: activeUsers.length,
        engagementRate
      },
      systemAlerts: alerts,
      lastUpdated: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: 'Health metrics error', error: err.message });
  }
};

exports.getActivityHeatmap = async (req, res) => {
  try {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const heatmap = await Activity.aggregate([
      { $match: { createdAt: { $gte: last7d } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hour: { $hour: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]);
    res.json(heatmap);
  } catch (err) {
    res.status(500).json({ message: 'Heatmap error', error: err.message });
  }
};

// ============================================================================
// 5. NOTIFICATION BROADCASTS
// ============================================================================

exports.getNotificationDashboard = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments();
    const unreadNotifications = await Notification.countDocuments({ isRead: false });
    const byType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const recent = await Notification.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      totalNotifications,
      unreadNotifications,
      byType,
      recent
    });
  } catch (err) {
    res.status(500).json({ message: 'Notification dashboard error', error: err.message });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, targetRole = 'all', link = '/dashboard' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    await notifyRole(targetRole, {
      title,
      message,
      type: 'announcement',
      link
    });

    res.status(201).json({ message: `Broadcast sent to target: ${targetRole}` });
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed', error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete error', error: err.message });
  }
};

// ============================================================================
// 6. USER MANAGEMENT & STATS
// ============================================================================

exports.getStats = async (req, res) => {
  try {
    const [totalResources, totalUsers, totalVerifiedUsers, viewAgg, viewsThisWeek, categoryBreakdown] = await Promise.all([
      Resource.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Resource.aggregate([{ $group: { _id: null, totalViews: { $sum: '$viewCount' } } }]),
      Activity.countDocuments({ action: 'view', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      Resource.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      totalResources,
      totalUsers,
      totalVerifiedUsers,
      totalViews: viewAgg[0]?.totalViews || 0,
      viewsThisWeek,
      categoryBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: 'Stats error', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load users', error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['founder', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role', error: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin' && String(user._id) === String(req.user.id)) {
      return res.status(400).json({ message: 'Cannot deactivate your own admin account.' });
    }

    user.isActive = user.isActive === false ? true : false;
    await user.save();

    res.json({ message: `User account ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ message: 'Toggle status failed', error: err.message });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const logs = await Activity.find()
      .populate('user', 'name email role')
      .populate('resource', 'title category')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Activity log error', error: err.message });
  }
};

exports.checkDuplicate = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.json({ duplicates: [] });

    const allResources = await Resource.find().lean();
    const ranked = rankByQuery(`${title} ${description || ''}`, allResources);
    const likelyDuplicates = ranked.filter(r => r.matchScore >= 55).slice(0, 3);

    res.json({ duplicates: likelyDuplicates });
  } catch (err) {
    res.status(500).json({ message: 'Duplicate check failed', error: err.message });
  }
};

exports.bulkCreateResources = async (req, res) => {
  try {
    const { resources } = req.body;
    if (!Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({ message: 'No resources provided' });
    }
    const docs = resources.map(r => ({
      ...r,
      createdBy: req.user.id,
      status: 'approved',
      verificationStatus: 'verified'
    }));
    const created = await Resource.insertMany(docs, { ordered: false });
    res.status(201).json({ message: `${created.length} resources imported successfully`, created });
  } catch (err) {
    res.status(500).json({ message: 'Bulk import failed', error: err.message });
  }
};
