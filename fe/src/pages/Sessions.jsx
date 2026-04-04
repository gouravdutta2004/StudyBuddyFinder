import { useEffect, useState } from 'react';
import api from '../api/axios';
import SessionCard from '../components/SessionCard';
import { useAuth } from '../context/AuthContext';
import { Calendar as CalendarIcon, Plus, X, Download, List as ListIcon, ChevronLeft, ChevronRight, Clock, MapPin, Video, Users, Zap, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import RatingModal from '../components/RatingModal';
import { Container, Typography, Box, Button, Tabs, Tab, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormControlLabel, Switch, CircularProgress, useTheme, ToggleButton, ToggleButtonGroup, Chip, Avatar } from '@mui/material';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { SpiralAnimation } from '../components/ui/SpiralAnimation';

const defaultForm = { title: '', description: '', subject: '', scheduledAt: '', duration: 60, isOnline: true, meetingLink: '', location: '', maxParticipants: 5, recurrence: 'NONE' };

export default function Sessions() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [ratingSession, setRatingSession] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarSessionObj, setCalendarSessionObj] = useState(null);

  const fetchSessions = async () => {
    try {
      const [allRes, myRes] = await Promise.all([api.get('/sessions'), api.get('/sessions/my')]);
      setSessions(allRes.data); setMySessions(myRes.data);
    } catch { toast.error('COMM_LINK_DISCONNECTED'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      await api.post('/sessions', form);
      toast.success('Sprint Sequence Initiated');
      setShowForm(false); setForm(defaultForm); fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Sequence Failure'); }
    finally { setCreating(false); }
  };
  const handleJoin = async (id) => { try { await api.post(`/sessions/${id}/join`); toast.success('Joined Sprint Crew'); fetchSessions(); } catch (err) { toast.error(err.response?.data?.message || 'Failure'); } };
  const handleLeave = async (id) => {
    try {
      const sessionToRate = [...sessions, ...mySessions].find(s => s._id === id);
      await api.post(`/sessions/${id}/leave`); toast.success('Aborted Sprint'); fetchSessions();
      if (sessionToRate) setRatingSession(sessionToRate);
    } catch (err) { toast.error(err.response?.data?.message || 'Failure'); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Scuttle this Sprint Sequence?')) return;
    try { await api.delete(`/sessions/${id}`); toast.success('Sprint Scuttled'); fetchSessions(); } catch (err) { toast.error(err.response?.data?.message || 'Failure'); }
  };
  const handleExport = async () => {
    try {
      const res = await api.get('/calendar/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'sprint-log.ics'); document.body.appendChild(link); link.click(); link.remove();
      toast.success('Sprint Log Exported');
    } catch { toast.error('Export Failure'); }
  };

  const displaySessions = tabIndex === 0 ? sessions : mySessions;
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const monthStart = startOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#6366f1' }} /></Box>;

  return (
    <>
      <SpiralAnimation />
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 4, mb: 10, fontFamily: "'Inter', sans-serif" }}>
        {ratingSession && <RatingModal session={ratingSession} onClose={() => setRatingSession(null)} />}
      
      {/* ── SPRINT HEADER ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 900, color: '#f59e0b', letterSpacing: 3, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Terminal size={14} /> /SYS/MODULE_01/SPRINT
          </Typography>
          <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '2.5rem', fontWeight: 900, color: isDark ? 'white' : '#0f172a', fontStyle: 'normal', letterSpacing: -1.5, lineHeight: 1 }}>
            ACTIVE SPRINTS
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small"
            sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '8px', p: 0.5, '& .MuiToggleButton-root': { border: 'none', borderRadius: '6px', color: 'text.secondary', px: 2, py: 0.5 }, '& .Mui-selected': { bgcolor: '#6366f1 !important', color: 'white !important', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' } }}>
            <ToggleButton value="list"><ListIcon size={16} /></ToggleButton>
            <ToggleButton value="calendar"><CalendarIcon size={16} /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" startIcon={<Download size={16} />} onClick={handleExport}
            sx={{ borderRadius: '8px', fontWeight: 900, fontStyle: 'italic', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.4)', textTransform: 'uppercase', py: 0.75, '&:hover': { bgcolor: 'rgba(167,139,250,0.1)' } }}>
            Export Log
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowForm(true)}
            sx={{ borderRadius: '8px', fontWeight: 900, fontStyle: 'italic', bgcolor: '#10b981', color: '#022c22', textTransform: 'uppercase', py: 0.75, boxShadow: '0 4px 0 #059669', '&:active': { transform: 'translateY(4px)', boxShadow: '0 0 0 transparent' }, '&:hover': { bgcolor: '#34d399' } }}>
            Initialize Sprint
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', mb: 4 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)}
          TabIndicatorProps={{ sx: { height: 4, borderRadius: '4px 4px 0 0', bgcolor: '#6366f1' } }}
          sx={{ '& .MuiTab-root': { fontWeight: 900, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 1, fontSize: '0.85rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', '&.Mui-selected': { color: isDark ? 'white' : '#0f172a' } } }}>
          <Tab label="GLOBAL SPRINTS" />
          <Tab label="MY CREW SPRINTS" />
        </Tabs>
      </Box>

      {/* Initialize Modals */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', bgcolor: isDark ? '#0d1117' : '#fff', border: '3px solid #10b981' } }}>
        <Box sx={{ bgcolor: '#10b981', color: '#022c22', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: 2 }}>[+] INITIALIZE_SPRINT</Typography>
          <IconButton onClick={() => setShowForm(false)} size="small" sx={{ color: '#022c22' }}><X size={18} /></IconButton>
        </Box>
        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <Box component="form" id="create-session-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField label="Sprint Designation (Title)" required fullWidth value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} variant="outlined" size="small" />
            <TextField label="Subject Matter" required fullWidth value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} variant="outlined" size="small" />
            <TextField label="Briefing Notes" fullWidth multiline rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} variant="outlined" />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="T-0 (Date & Time)" type="datetime-local" required fullWidth value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Duration (min)" type="number" required fullWidth value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} variant="outlined" size="small" inputProps={{ min: 15, max: 480 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Max Crew Size" type="number" required fullWidth value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: +e.target.value })} variant="outlined" size="small" inputProps={{ min: 2, max: 50 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={form.isOnline} onChange={e => setForm({ ...form, isOnline: e.target.checked })} color="success" />} label={<Typography sx={{ fontFamily: 'monospace', fontWeight: 800 }}>DIGITAL LINK</Typography>} sx={{ mt: 0.5, ml: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel control={<Switch checked={form.recurrence === 'WEEKLY'} onChange={e => setForm({ ...form, recurrence: e.target.checked ? 'WEEKLY' : 'NONE' })} color="primary" />} label={<Typography sx={{ fontFamily: 'monospace', fontWeight: 800 }}>LOOP WEEKLY</Typography>} sx={{ mt: 0.5, ml: 1 }} />
              </Grid>
            </Grid>
            {form.isOnline ? (
              <TextField label="Neural Link URL (Optional)" fullWidth value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} variant="outlined" size="small" />
            ) : (
              <TextField label="Physical Coordinates" fullWidth required={!form.isOnline} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} variant="outlined" size="small" />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowForm(false)} variant="outlined" sx={{ fontWeight: 900, fontStyle: 'normal', borderRadius: '8px' }}>Abort</Button>
          <Button type="submit" form="create-session-form" variant="contained" disabled={creating} sx={{ fontWeight: 900, fontStyle: 'normal', borderRadius: '8px', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>{creating ? 'Sequencing...' : 'Sequence Start'}</Button>
        </DialogActions>
      </Dialog>

      {/* Calendar Details Modal */}
      <Dialog open={!!calendarSessionObj} onClose={() => setCalendarSessionObj(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px', bgcolor: isDark ? '#0d1117' : '#fff', border: '3px solid #6366f1' } }}>
        {calendarSessionObj && (
          <>
            <Box sx={{ bgcolor: '#6366f1', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: 2 }}>[i] SPRINT_LOG</Typography>
              <IconButton onClick={() => setCalendarSessionObj(null)} size="small" sx={{ color: 'white' }}><X size={18} /></IconButton>
            </Box>
            <DialogContent sx={{ pt: 4 }}>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, fontStyle: 'italic', lineHeight: 1.1, mb: 1 }}>{calendarSessionObj.title}</Typography>
              <Chip label={calendarSessionObj.subject} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 900, fontFamily: 'monospace', mb: 3 }} />
              
              <Box display="flex" flexDirection="column" gap={2.5}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ flexShrink: 0, width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} color="#6366f1" /></Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>T-0 / DUR</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{format(parseISO(calendarSessionObj.scheduledAt), 'MMM d, yyyy - h:mm a')}</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b' }}>{calendarSessionObj.duration} MIN</Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ flexShrink: 0, width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{calendarSessionObj.isOnline ? <Video size={16} color="#6366f1" /> : <MapPin size={16} color="#6366f1" />}</Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>LOC</Typography>
                    <Typography sx={{ fontWeight: 800, wordBreak: 'break-all' }}>{calendarSessionObj.isOnline ? (calendarSessionObj.meetingLink ? <a href={calendarSessionObj.meetingLink} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{calendarSessionObj.meetingLink}</a> : 'NEURAL LINK PENDING') : calendarSessionObj.location}</Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ flexShrink: 0, width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="#6366f1" /></Box>
                  <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>CREW</Typography>
                    <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800 }}>{calendarSessionObj.participants?.length || 0} / {calendarSessionObj.maxParticipants} MANIFESTED</Typography>
                  </Box>
                </Box>
              </Box>

              {calendarSessionObj.description && (
                <Box sx={{ mt: 3, p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                  <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '0.85rem', fontWeight: 500 }}>{calendarSessionObj.description}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
              {calendarSessionObj.participants?.some(p => p._id === user?._id || p === user?._id) ? (
                <Button fullWidth variant="outlined" color="error" onClick={() => { handleLeave(calendarSessionObj._id); setCalendarSessionObj(null); }} sx={{ borderRadius: '8px', fontWeight: 900, fontStyle: 'italic' }}>Abort Sprint</Button>
              ) : calendarSessionObj.host?._id === user?._id ? (
                <Button fullWidth variant="outlined" color="error" onClick={() => { handleDelete(calendarSessionObj._id); setCalendarSessionObj(null); }} sx={{ borderRadius: '8px', fontWeight: 900, fontStyle: 'italic' }}>Scuttle Sprint</Button>
              ) : (
                <Button fullWidth variant="contained" onClick={() => { handleJoin(calendarSessionObj._id); setCalendarSessionObj(null); }} sx={{ bgcolor: '#10b981', color: '#022c22', borderRadius: '8px', fontWeight: 900, fontStyle: 'italic', '&:hover': { bgcolor: '#34d399' } }}>Join Sprint</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Grid or Calendar View */}
      {displaySessions.length === 0 && viewMode === 'list' ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <Zap size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, fontStyle: 'italic', color: 'text.primary', letterSpacing: -0.5 }}>NO SPRINTS DETECTED</Typography>
          <Typography variant="body2" mt={1}>Initialize a sprint to set the pace.</Typography>
        </Box>
      ) : viewMode === 'list' ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3,
        }}>
          {displaySessions.map(s => (
            <Box key={s._id} sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(24px)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              borderRadius: '24px',
              boxShadow: isDark
                ? '0 8px 32px 0 rgba(0,0,0,0.35)'
                : '0 8px 32px 0 rgba(0,0,0,0.10)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: isDark
                  ? '0 16px 48px 0 rgba(79,70,229,0.3)'
                  : '0 16px 48px 0 rgba(79,70,229,0.15)',
                borderColor: 'rgba(99,102,241,0.3)',
              },
            }}>
              <SessionCard session={s} currentUserId={user?._id} onJoin={handleJoin} onLeave={handleLeave} onDelete={handleDelete} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ bgcolor: isDark ? '#0d1117' : '#ffffff', borderRadius: '16px', border: '3px solid', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.3)', overflow: 'hidden' }}>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '3px solid', borderColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.3)' }}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, fontStyle: 'normal', textTransform: 'uppercase', color: isDark ? 'white' : '#0f172a' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <Box display="flex" gap={1}>
              <IconButton onClick={prevMonth} sx={{ border: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '8px' }}><ChevronLeft size={20} /></IconButton>
              <IconButton onClick={nextMonth} sx={{ border: '2px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '8px' }}><ChevronRight size={20} /></IconButton>
            </Box>
          </Box>
          
          <Grid container sx={{ bgcolor: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs={12/7} key={day} sx={{ p: 2, textAlign: 'center' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 900, color: 'text.secondary', letterSpacing: 1 }}>{day}</Typography>
              </Grid>
            ))}
          </Grid>

          <Grid container sx={{ '& .MuiGrid-item': { borderRight: '1px solid', borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}>
            {calendarDays.map((day, idx) => {
              const dateEvents = displaySessions.filter(s => isSameDay(parseISO(s.scheduledAt), day));
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <Grid item xs={12/7} key={day.toString()} sx={{ minHeight: 140, p: 1, bgcolor: isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.2)', opacity: isCurrentMonth ? 1 : 0.4, transition: 'all 0.2s', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}>
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isToday ? '#6366f1' : 'transparent', color: isToday ? 'white' : 'text.primary', fontWeight: 900, fontFamily: 'monospace' }}>
                      {format(day, 'd')}
                    </Box>
                  </Box>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {dateEvents.slice(0, 3).map(event => (
                      <Box key={event._id} onClick={() => setCalendarSessionObj(event)}
                        sx={{ p: 1, borderRadius: '6px', cursor: 'pointer', bgcolor: event.isOnline ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', borderLeft: '3px solid', borderColor: event.isOnline ? '#6366f1' : '#10b981', '&:hover': { bgcolor: event.isOnline ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)' } }}>
                        <Typography sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, fontFamily: 'monospace', color: event.isOnline ? '#6366f1' : '#10b981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          [{format(parseISO(event.scheduledAt), 'HH:mm')}]
                        </Typography>
                        <Typography sx={{ display: 'block', fontSize: '0.75rem', fontStyle: 'italic', fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mt: 0.2 }}>
                          {event.title}
                        </Typography>
                      </Box>
                    ))}
                    {dateEvents.length > 3 && <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'text.secondary', fontWeight: 900, textAlign: 'center', mt: 0.5 }}>+{dateEvents.length - 3} MORE</Typography>}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
      </Container>
    </>
  );
}
