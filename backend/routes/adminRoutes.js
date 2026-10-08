const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// AI Metadata & Approval
router.post('/suggest-metadata', adminController.suggestMetadataForResource);
router.post('/suggest-tags', adminController.suggestTagsForResource);
router.get('/resources/pending-approval', adminController.getPendingResourceApprovals);
router.post('/resources/:id/approve', adminController.approveResourceMetadata);
router.put('/resources/:id/metadata-review', adminController.reviewResourceMetadata);

// Mentor Verification
router.get('/mentors/pending-verification', adminController.getPendingMentorVerifications);
router.post('/mentors/:id/verify', adminController.verifyMentor);

// Resource Status & Deadlines
router.get('/resources/status-report', adminController.getResourceStatusReport);
router.put('/resources/:id/verification-status', adminController.updateResourceVerificationStatus);
router.post('/check-duplicate', adminController.checkDuplicate);
router.post('/resources/bulk', adminController.bulkCreateResources);

// Platform Health & Analytics
router.get('/stats', adminController.getStats);
router.get('/platform-health', adminController.getPlatformHealth);
router.get('/activity-heatmap', adminController.getActivityHeatmap);
router.get('/activity', adminController.getActivityLog);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);

// Notification Management
router.get('/notifications/dashboard', adminController.getNotificationDashboard);
router.post('/notifications/broadcast', adminController.broadcastNotification);
router.delete('/notifications/:id', adminController.deleteNotification);

module.exports = router;
