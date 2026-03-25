const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getProfile, updateProfile, searchUsers, getMatches,
  sendRequest, acceptRequest, rejectRequest, getConnections, disconnectUser,
  submitFeedback, getPublicSubjects, logStudy, getLeaderboard
} = require('../controllers/userController');

router.post('/feedback', protect, submitFeedback);
router.get('/subjects', protect, getPublicSubjects);

router.get('/support-admin', protect, require('../controllers/userController').getSupportAdmin);
router.get('/search', protect, searchUsers);
router.get('/matches', protect, getMatches);
router.get('/connections', protect, getConnections);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/:id/quick-peek', protect, require('../controllers/userController').getQuickPeek);
router.get('/:id', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/connect/:userId', protect, sendRequest);
router.post('/accept/:userId', protect, acceptRequest);
router.post('/reject/:userId', protect, rejectRequest);
router.post('/disconnect/:userId', protect, disconnectUser);
router.post('/log-study', protect, logStudy);
router.post('/sync-github', protect, require('../controllers/userController').syncGithub);

module.exports = router;
