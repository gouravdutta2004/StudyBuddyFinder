import { useEffect, useState } from 'react';
import api from '../api/axios';
import SessionCard from '../components/SessionCard';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import RatingModal from '../components/RatingModal';
import { Container, Typography, Box, Button, Tabs, Tab, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, FormControlLabel, Switch, CircularProgress, useTheme } from '@mui/material';

const defaultForm = { title: '', description: '', subject: '', scheduledAt: '', duration: 60, isOnline: true, meetingLink: '', location: '', maxParticipants: 5 };

export default function Sessions() {
  const { user } = useAuth();
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);
  const [ratingSession, setRatingSession] = useState(null);

  const fetchSessions = async () => {
    try {
      const [allRes, myRes] = await Promise.all([api.get('/sessions'), api.get('/sessions/my')]);
      setSessions(allRes.data);
      setMySessions(myRes.data);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/sessions', form);
      toast.success('Session created!');
      setShowForm(false);
      setForm(defaultForm);
      fetchSessions();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const handleJoin = async (id) => {
    try { await api.post(`/sessions/${id}/join`); toast.success('Joined!'); fetchSessions(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleLeave = async (id) => {
    try { 
      const sessionToRate = [...sessions, ...mySessions].find(s => s._id === id);
      await api.post(`/sessions/${id}/leave`); 
      toast.success('Left session');
      fetchSessions();
      if (sessionToRate) setRatingSession(sessionToRate);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    try { await api.delete(`/sessions/${id}`); toast.success('Session deleted'); fetchSessions(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/calendar/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'study-sessions.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Calendar exported successfully!');
    } catch(err) {
      toast.error('Failed to export calendar');
    }
  };

  const displaySessions = tabIndex === 0 ? sessions : mySessions;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, mb: 10 }}>
      {ratingSession && <RatingModal session={ratingSession} onClose={() => setRatingSession(null)} />}
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="text.primary">
          Study Sessions
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<Download size={18} />} 
            onClick={handleExport}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Export ICS
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<Plus size={18} />} 
            onClick={() => setShowForm(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Create Session
          </Button>
        </Box>
      </Box>

      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, pb: 1 }}>
          Create Study Session
          <IconButton onClick={() => setShowForm(false)} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" id="create-session-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField 
              label="Session Title" required fullWidth value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} variant="outlined" size="small" 
            />
            <TextField 
              label="Subject" required fullWidth value={form.subject} 
              onChange={e => setForm({ ...form, subject: e.target.value })} variant="outlined" size="small" 
            />
            <TextField 
              label="Description" fullWidth multiline rows={3} value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} variant="outlined" 
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Date & Time" type="datetime-local" required fullWidth value={form.scheduledAt} 
                  onChange={e => setForm({ ...form, scheduledAt: e.target.value })} 
                  variant="outlined" size="small" InputLabelProps={{ shrink: true }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Duration (min)" type="number" required fullWidth value={form.duration} 
                  onChange={e => setForm({ ...form, duration: +e.target.value })} 
                  variant="outlined" size="small" inputProps={{ min: 15, max: 480 }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Max Participants" type="number" required fullWidth value={form.maxParticipants} 
                  onChange={e => setForm({ ...form, maxParticipants: +e.target.value })} 
                  variant="outlined" size="small" inputProps={{ min: 2, max: 50 }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel 
                  control={<Switch checked={form.isOnline} onChange={e => setForm({ ...form, isOnline: e.target.checked })} color="primary" />} 
                  label={<Typography variant="body2" fontWeight={600}>Online Session</Typography>} 
                  sx={{ mt: 0.5, ml: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel 
                  control={<Switch checked={form.recurrence === 'WEEKLY'} onChange={e => setForm({ ...form, recurrence: e.target.checked ? 'WEEKLY' : 'NONE' })} color="secondary" />} 
                  label={<Typography variant="body2" fontWeight={600}>Repeat Weekly (4 Weeks)</Typography>} 
                  sx={{ mt: 0.5, ml: 1 }}
                />
              </Grid>
            </Grid>
            
            {form.isOnline ? (
              <TextField 
                label="Meeting Link (optional)" fullWidth value={form.meetingLink} 
                onChange={e => setForm({ ...form, meetingLink: e.target.value })} variant="outlined" size="small" 
              />
            ) : (
              <TextField 
                label="Location" fullWidth required={!form.isOnline} value={form.location} 
                onChange={e => setForm({ ...form, location: e.target.value })} variant="outlined" size="small" 
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
          <Button onClick={() => setShowForm(false)} variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }}>
            Cancel
          </Button>
          <Button type="submit" form="create-session-form" variant="contained" disabled={creating} sx={{ fontWeight: 700, borderRadius: 2 }}>
            {creating ? 'Creating...' : 'Create Session'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} aria-label="session tabs" sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '1rem' } }}>
          <Tab label="All Sessions" />
          <Tab label="My Sessions" />
        </Tabs>
      </Box>

      {displaySessions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <Calendar size={64} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            No sessions found
          </Typography>
          <Typography variant="body2" mt={1}>
            Create a session to get started
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displaySessions.map(s => (
            <Grid item xs={12} md={6} lg={4} key={s._id}>
              <SessionCard session={s} currentUserId={user?._id} onJoin={handleJoin} onLeave={handleLeave} onDelete={handleDelete} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
