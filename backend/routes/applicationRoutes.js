const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', applicationController.getMyApplications);
router.post('/', applicationController.trackResource);
router.put('/:id', applicationController.updateApplication);
router.delete('/:id', applicationController.deleteApplication);

module.exports = router;
