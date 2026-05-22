const express = require('express');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', userController.createUser);
router.get('/', userController.listUsers);
router.get('/:id', requireAuth, userController.getUser);

module.exports = router;