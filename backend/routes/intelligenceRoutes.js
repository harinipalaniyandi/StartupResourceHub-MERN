const express = require('express');
const router = express.Router();
const intelligenceController = require('../controllers/intelligenceController');
const { protect } = require('../middleware/auth');

router.get('/readiness', protect, intelligenceController.getReadinessAnalysis);
router.post('/readiness/reanalyze', protect, intelligenceController.reanalyzeReadiness);
router.get('/opportunity-gaps', protect, intelligenceController.getOpportunityGaps);
router.get('/deadlines', protect, intelligenceController.getDeadlineIntelligence);

module.exports = router;
