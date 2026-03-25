const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { createSession, getSessions, getMySessions, getSessionById, joinSession, leaveSession, deleteSession, addNote, rsvpSession } = require('../controllers/sessionController');

router.get('/', protect, getSessions);
router.get('/my', protect, getMySessions);
router.get('/:id', protect, getSessionById);
router.post('/', protect, createSession);
router.post('/:id/join', protect, joinSession);
router.post('/:id/leave', protect, leaveSession);
router.post('/:id/rsvp', protect, rsvpSession);
router.post('/:id/notes', protect, addNote);
router.delete('/:id', protect, deleteSession);

module.exports = router;
