import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, MapPin, Trash2, LogIn, LogOut, ExternalLink, CalendarPlus, X, CheckCircle, Clock3, XCircle } from 'lucide-react';
import { format, addMinutes, differenceInSeconds } from 'date-fns';
import { Link } from 'react-router-dom';
import { Card, Box, Typography, Chip, Button, IconButton, useTheme, Avatar, AvatarGroup } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SessionCard({ session, currentUserId, onJoin, onLeave, onDelete }) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  const isHost = session.host?._id === currentUserId || session.host === currentUserId;
  const isParticipant = session.participants?.some(p => (p._id || p) === currentUserId);
  const isFull = session.participants?.length >= session.maxParticipants;
  const myRsvp = session.rsvps?.find(r => r.userId === currentUserId)?.status || 'PENDING';

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(session.scheduledAt);
      const now = new Date();
      if (start > now && differenceInSeconds(start, now) <= 900) { // 15 mins
        const m = Math.floor(differenceInSeconds(start, now) / 60);
        const s = differenceInSeconds(start, now) % 60;
        setCountdown(`${m}m ${s}s`);
      } else {
        setCountdown(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session.scheduledAt]);

  const handleRsvp = async (status) => {
    try {
      await api.post(`/sessions/${session._id}/rsvp`, { status });
      toast.success(`RSVP set to ${status}`);
    } catch {
      toast.error('Failed to RSVP');
    }
  };

  const getCalendarUrl = () => {
    const start = new Date(session.scheduledAt);
    const end = addMinutes(start, session.duration || 60);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', session.title || 'Study Buddy Session');
    url.searchParams.append('dates', `${formatDate(start)}/${formatDate(end)}`);
    url.searchParams.append('details', session.description || 'Study session with connections');
    url.searchParams.append('location', session.isOnline ? (session.meetingLink || 'Online') : session.location);
    return url.toString();
  };

  return (
    <>
      <motion.div layoutId={`card-${session._id}`} onClick={() => !isOpen && setIsOpen(true)} style={{ height: '100%', cursor: 'pointer' }}>
        <Card variant="outlined" sx={{ 
          borderRadius: 4, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden',
          transition: 'box-shadow 0.2s', '&:hover': { boxShadow: theme.shadows[6] }
        }}>
          {countdown && (
            <motion.div initial={{ y: -50 }} animate={{ y: 0 }} style={{ background: '#ef4444', color: 'white', padding: '4px 8px', textAlign: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
              Starts in {countdown}!
            </motion.div>
          )}

          <Box sx={{ p: 3, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{session.title}</Typography>
              <Chip label={session.subject} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                <Clock size={16} /> {format(new Date(session.scheduledAt), 'p')} · {session.duration}m
              </Typography>
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                <Users size={16} /> {session.participants?.length}/{session.maxParticipants} part.
              </Typography>
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1}>
                {session.isOnline ? <Video size={16} color={theme.palette.info.main} /> : <MapPin size={16} color={theme.palette.error.main} />}
                {session.isOnline ? 'Online' : session.location}
              </Typography>
            </Box>
          </Box>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <Box sx={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} />
            
            <motion.div layoutId={`card-${session._id}`} style={{ background: theme.palette.background.paper, borderRadius: '24px', width: '100%', maxWidth: 500, zIndex: 1301, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              
              <Box sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', p: 4, position: 'relative', color: 'white' }}>
                <IconButton onClick={() => setIsOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}><X /></IconButton>
                <Chip label={session.subject} size="small" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800 }} />
                <Typography variant="h4" fontWeight={900}>{session.title}</Typography>
                <Typography variant="subtitle1" fontWeight={600} mt={1}>{format(new Date(session.scheduledAt), 'PPPP')} at {format(new Date(session.scheduledAt), 'p')}</Typography>
              </Box>

              <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary" mb={4}>{session.description || 'No description provided.'}</Typography>

                <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                  <Box>
                    <Typography variant="overline" fontWeight={800} color="text.secondary">Host</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Avatar src={session.host?.avatar} sx={{ width: 32, height: 32 }} />
                      <Typography variant="body2" fontWeight={700}>{session.host?.name}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="overline" fontWeight={800} color="text.secondary">Attendees</Typography>
                    <AvatarGroup max={4} sx={{ mt: 0.5, '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                      {session.participants?.map(p => (
                        <Avatar key={p._id || p} src={p.avatar} />
                      ))}
                    </AvatarGroup>
                  </Box>
                </Box>

                {/* Smart RSVP UI */}
                {(isHost || isParticipant) && (
                  <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', p: 2, borderRadius: 3, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={800}>Your RSVP</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" color={myRsvp === 'ATTENDING' ? 'success' : 'default'} onClick={() => handleRsvp('ATTENDING')}><CheckCircle size={20} /></IconButton>
                      <IconButton size="small" color={myRsvp === 'PENDING' ? 'warning' : 'default'} onClick={() => handleRsvp('PENDING')}><Clock3 size={20} /></IconButton>
                      <IconButton size="small" color={myRsvp === 'DECLINED' ? 'error' : 'default'} onClick={() => handleRsvp('DECLINED')}><XCircle size={20} /></IconButton>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {!isHost && !isParticipant && !isFull && (
                    <Button variant="contained" fullWidth onClick={() => onJoin(session._id)} startIcon={<LogIn />} sx={{ fontWeight: 800 }}>Join Session</Button>
                  )}
                  {isParticipant && !isHost && (
                    <Button variant="outlined" color="error" fullWidth onClick={() => onLeave(session._id)} startIcon={<LogOut />} sx={{ fontWeight: 800 }}>Leave Session</Button>
                  )}
                  {(isHost || isParticipant) && session.isOnline && (
                    <Button component={Link} to={`/study-room/${session._id}`} variant="contained" color="success" fullWidth startIcon={<ExternalLink />} sx={{ fontWeight: 800 }}>
                      Enter Video Room
                    </Button>
                  )}
                  {(isHost || isParticipant) && (
                    <Button component="a" href={getCalendarUrl()} target="_blank" variant="outlined" color="info" fullWidth startIcon={<CalendarPlus />} sx={{ fontWeight: 800 }}>
                      Add to Calendar
                    </Button>
                  )}
                  {isHost && (
                    <Button color="error" fullWidth onClick={() => onDelete(session._id)} startIcon={<Trash2 />} sx={{ fontWeight: 800 }}>
                      Cancel Session
                    </Button>
                  )}
                </Box>
              </Box>

            </motion.div>
          </Box>
        )}
      </AnimatePresence>
    </>
  );
}
