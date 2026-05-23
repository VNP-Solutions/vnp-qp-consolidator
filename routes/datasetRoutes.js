const express = require('express');
const datasetController = require('../controllers/datasetController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, datasetController.listData);
router.post('/query', requireAuth, datasetController.queryData);
router.get('/distinct/:field', requireAuth, datasetController.distinct);

module.exports = router;