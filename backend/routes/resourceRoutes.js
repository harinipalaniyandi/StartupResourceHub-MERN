const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');

router.get('/search', optionalAuth, resourceController.search);
router.post('/semantic-search', optionalAuth, resourceController.semanticSearch);
router.get('/recommendations', protect, resourceController.getRecommendations);
router.get('/analytics/trend', protect, adminOnly, resourceController.trendAnalytics);
router.get('/:id', optionalAuth, resourceController.getOne);

router.get('/', protect, adminOnly, resourceController.getAll);
router.post('/', protect, adminOnly, resourceController.create);
router.put('/:id', protect, adminOnly, resourceController.update);
router.delete('/:id', protect, adminOnly, resourceController.remove);

module.exports = router;
