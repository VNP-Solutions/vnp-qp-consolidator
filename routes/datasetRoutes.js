const express = require('express');
const datasetController = require('../controllers/datasetController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, datasetController.listData);

module.exports = router;