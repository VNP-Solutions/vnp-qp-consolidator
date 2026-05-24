const express = require('express');
const datasetController = require('../controllers/datasetController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, datasetController.listData);
router.post('/query', requireAuth, datasetController.queryData);
router.get('/distinct/:field', requireAuth, datasetController.distinct);
router.get('/stats', requireAuth, datasetController.stats);
router.get('/analytics', requireAuth, datasetController.analytics);
router.post('/export', requireAuth, datasetController.exportData);

module.exports = router;