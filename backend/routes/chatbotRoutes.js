const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect, optionalAuth } = require('../middleware/auth');

// Conversations Management (Requires Login)
router.get('/conversations', protect, chatbotController.getConversations);
router.post('/conversations', protect, chatbotController.createConversation);
router.delete('/conversations', protect, chatbotController.clearAllConversations);
router.get('/conversations/:id', protect, chatbotController.getConversation);
router.put('/conversations/:id/rename', protect, chatbotController.renameConversation);
router.delete('/conversations/:id', protect, chatbotController.deleteConversation);

// Core Chat Endpoint (Logged-in or Guest)
router.post('/', optionalAuth, chatbotController.chat);
router.post('/message', optionalAuth, chatbotController.chat);

module.exports = router;
