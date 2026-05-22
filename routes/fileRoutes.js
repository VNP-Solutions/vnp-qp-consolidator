const express = require('express');
const multer = require('multer');

const fileController = require('../controllers/fileController');
const { requireAuth } = require('../middleware/authMiddleware');

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_BYTES },
});

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), fileController.uploadFile);
router.get('/', requireAuth, fileController.listFiles);
router.get('/:id', requireAuth, fileController.getFile);
router.post('/:id/parse', requireAuth, fileController.parseFile);
router.delete('/:id', requireAuth, fileController.deleteFile);

module.exports = router;