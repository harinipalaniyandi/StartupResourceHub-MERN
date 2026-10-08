const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');
const { protect } = require('../middleware/auth');

router.get('/', protect, roadmapController.getRoadmap);
router.post('/generate', protect, roadmapController.generateRoadmap);
router.delete('/', protect, roadmapController.deleteRoadmap);
router.put('/tasks/:stageNumber/:taskId', protect, roadmapController.toggleTask);

module.exports = router;
