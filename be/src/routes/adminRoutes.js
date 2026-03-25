const express = require('express');
const router = express.Router();
const { 
  getUsers, updateUser, deleteUser, createUser, 
  getSystemConnections, severSystemConnection, 
  getSubjects, createSubject, deleteSubject, 
  getFeedback, updateFeedbackStatus, broadcastEmail,
  getDashboardStats, getUserGrowth, getSessionStats, getSystemHealth,
  getSystemConfigs, saveSystemConfig, getAuditLogs, bulkActionUsers,
  getReports, updateReport, scanContent, updateFlaggedItem,
  getGamificationLeaderboard, awardBadge
} = require('../controllers/adminController');
const { protect, admin, isOrgAdmin } = require('../middleware/auth');
const authorizeRole = require('../middleware/rbac');

// ── ORG ADMIN HYBRID AUTH ROUTES ── //
router.get('/pending-users', protect, isOrgAdmin, require('../controllers/adminController').getPendingUsers);
router.put('/users/:id/approve', protect, isOrgAdmin, require('../controllers/adminController').approveUser);
router.put('/users/:id/reject', protect, isOrgAdmin, require('../controllers/adminController').rejectUser);

router.get('/users', protect, admin, authorizeRole('Moderator'), getUsers);
router.post('/users', protect, admin, authorizeRole('Super Admin'), createUser);
router.put('/users/:id', protect, admin, authorizeRole('Moderator'), updateUser);
router.delete('/users/:id', protect, admin, authorizeRole('Super Admin'), deleteUser);

router.get('/connections', protect, admin, authorizeRole('Moderator'), getSystemConnections);
router.delete('/connections/:userA/:userB', protect, admin, authorizeRole('Super Admin'), severSystemConnection);

router.get('/subjects', protect, admin, authorizeRole('Moderator'), getSubjects);
router.post('/subjects', protect, admin, authorizeRole('Super Admin'), createSubject);
router.delete('/subjects/:id', protect, admin, authorizeRole('Super Admin'), deleteSubject);

router.post('/broadcast', protect, admin, authorizeRole('Super Admin'), broadcastEmail);
router.post('/users/bulk', protect, admin, authorizeRole('Super Admin'), bulkActionUsers);

router.get('/analytics/dashboard', protect, admin, authorizeRole('Moderator'), getDashboardStats);
router.get('/analytics/growth', protect, admin, authorizeRole('Moderator'), getUserGrowth);
router.get('/analytics/sessions', protect, admin, authorizeRole('Moderator'), getSessionStats);
router.get('/health', protect, admin, authorizeRole('Super Admin'), getSystemHealth);

router.get('/reports', protect, admin, authorizeRole('Support Agent', 'Moderator'), getReports);
router.put('/reports/:id', protect, admin, authorizeRole('Support Agent', 'Moderator'), updateReport);
router.get('/content-scan', protect, admin, authorizeRole('Moderator'), scanContent);
router.put('/flagged-items/:id', protect, admin, authorizeRole('Moderator'), updateFlaggedItem);

router.get('/configs', protect, admin, authorizeRole('Super Admin'), getSystemConfigs);
router.post('/configs', protect, admin, authorizeRole('Super Admin'), saveSystemConfig);

router.get('/audit-logs', protect, admin, authorizeRole('Support Agent', 'Moderator'), getAuditLogs);

router.get('/gamification/leaderboard', protect, admin, authorizeRole('Super Admin', 'Moderator'), getGamificationLeaderboard);
router.post('/gamification/badge', protect, admin, authorizeRole('Super Admin'), awardBadge);

module.exports = router;
