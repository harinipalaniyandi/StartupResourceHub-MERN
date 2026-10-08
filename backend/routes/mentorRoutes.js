const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, mentorController.listMentors);
router.get('/match', protect, mentorController.matchMentors);
router.post('/request', protect, mentorController.sendRequest);
router.get('/requests/sent', protect, mentorController.getSentRequests);
router.get('/requests/received', protect, mentorController.getReceivedRequests);
router.put('/requests/:id', protect, mentorController.respondToRequest);
router.get('/dashboard', protect, mentorController.getMentorDashboard);

// Two-way Mentorship Messaging Routes
router.post('/messages', protect, mentorController.sendMessage);
router.get('/messages/unread/count', protect, mentorController.getUnreadMessageCount);
router.get('/messages/:mentorRequestId', protect, mentorController.getMessages);
router.put('/messages/read-all/:mentorRequestId', protect, mentorController.markMessagesRead);

module.exports = router;
