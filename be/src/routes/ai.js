const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/chat', protect, aiController.chat);
router.post('/squad-tutor', protect, aiController.squadTutor);

module.exports = router;
