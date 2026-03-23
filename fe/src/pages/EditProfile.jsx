import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, UploadCloud, User as UserIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Typography, Box, Card, Avatar, Button, IconButton, TextField, MenuItem, Switch, FormControlLabel, Chip, Grid, Paper, Divider, Stack } from '@mui/material';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'History', 'Literature', 'Economics', 'Psychology', 'Engineering', 'Art', 'Music', 'Philosophy', 'Sociology', 'Statistics'];
const LEVELS = ['High School', 'Undergraduate', 'Graduate', 'PhD', 'Self-Learner', 'Other'];
const STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Mixed'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function EditProfile({ userId, onComplete }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const id = paramId || userId;
  const [form, setForm] = useState({ name: '', email: '', bio: '', avatar: '', university: '', location: '', educationLevel: 'Undergraduate', studyStyle: 'Mixed', preferOnline: true, subjects: [], availability: [], isAdmin: false, isActive: true, password: '' });
  const [subjectInput, setSubjectInput] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return toast.error('Check all fields');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('New passwords do not match');
    if (passwordForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    
    setChangingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated securely!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    if (id) {
      api.get(`/users/${id}`)
        .then(res => {
          const u = res.data;
          setForm({ 
            name: u.name || '', email: u.email || '', bio: u.bio || '', avatar: u.avatar || '', 
            university: u.university || '', location: u.location || '', educationLevel: u.educationLevel || 'Undergraduate', 
            studyStyle: u.studyStyle || 'Mixed', preferOnline: u.preferOnline ?? true, subjects: u.subjects || [], 
            availability: u.availability || [], isAdmin: u.isAdmin || false, isActive: u.isActive !== undefined ? u.isActive : true, password: '' 
          });
        })
        .catch(() => { toast.error('Failed to load user profile'); navigate('/dashboard'); });
    } else if (user) {
      setForm({ 
        name: user.name || '', email: user.email || '', bio: user.bio || '', avatar: user.avatar || '', 
        university: user.university || '', location: user.location || '', educationLevel: user.educationLevel || 'Undergraduate', 
        studyStyle: user.studyStyle || 'Mixed', preferOnline: user.preferOnline ?? true, subjects: user.subjects || [], 
        availability: user.availability || [], isAdmin: user.isAdmin || false, isActive: user.isActive !== undefined ? user.isActive : true, password: '' 
      });
    }
  }, [id, user, navigate]);

  const addSubject = (s) => {
    const sub = s || subjectInput.trim();
    if (sub && !form.subjects.includes(sub)) {
      setForm(f => ({ ...f, subjects: [...f.subjects, sub] }));
      setSubjectInput('');
    }
  };

  const removeSubject = (s) => setForm(f => ({ ...f, subjects: f.subjects.filter(x => x !== s) }));

  const addAvailability = () => setForm(f => ({ ...f, availability: [...f.availability, { day: 'Monday', startTime: '09:00', endTime: '11:00' }] }));
  const removeAvailability = (i) => setForm(f => ({ ...f, availability: f.availability.filter((_, idx) => idx !== i) }));
  const updateAvailability = (i, field, val) => setForm(f => ({ ...f, availability: f.availability.map((a, idx) => idx === i ? { ...a, [field]: val } : a) }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image exceeds 5MB limit');

    const loaderToast = toast.loading('Uploading instantly...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > maxSize) { height *= maxSize / width; width = maxSize; } }
        else { if (height > maxSize) { width *= maxSize / height; height = maxSize; } }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setForm(f => ({ ...f, avatar: dataUrl }));

        try {
          if (id) {
            await api.put(`/admin/users/${id}`, { ...form, avatar: dataUrl });
            toast.success('Admin: User photo safely deployed!', { id: loaderToast });
          } else {
            const { data } = await api.put('/users/profile', { avatar: dataUrl });
            updateUser(data);
            toast.success('Photo uploaded and deployed immediately!', { id: loaderToast });
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to save server photo', { id: loaderToast });
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    const loaderToast = toast.loading('Erasing photo natively...');
    setForm(f => ({ ...f, avatar: '' }));
    try {
      if (id) await api.put(`/admin/users/${id}`, { ...form, avatar: '' });
      else {
        const { data } = await api.put('/users/profile', { avatar: '' });
        updateUser(data);
      }
      toast.success('Photo correctly detached and deleted', { id: loaderToast });
    } catch {
      toast.error('Failed to sync deletion', { id: loaderToast });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }

      if (id) {
        await api.put(`/admin/users/${id}`, payload);
        toast.success('User profile updated by Admin!');
        if (onComplete) return onComplete();
        navigate('/dashboard');
      } else {
        const { data } = await api.put('/users/profile', payload);
        updateUser(data);
        toast.success('Profile updated!');
        if (onComplete) return onComplete();
        navigate('/dashboard');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, mb: 10 }}>
      <Typography variant="h4" fontWeight={800} color="text.primary" mb={4}>
        {id ? 'Admin: Edit User Profile' : 'Edit Profile'}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        
        {id && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderLeft: 6, borderColor: 'error.main', bgcolor: 'error.50' }}>
            <Typography variant="h6" fontWeight={700} color="error.main" mb={2}>Administrative Controls</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <FormControlLabel 
                control={<Switch checked={form.isAdmin} onChange={e => setForm({...form, isAdmin: e.target.checked})} disabled={form.email === 'admin@test.com'} color="primary" />} 
                label={<Typography variant="body2" fontWeight={600}>Grant Administrative Privilege</Typography>} 
              />
              <FormControlLabel 
                control={<Switch checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} color="success" />} 
                label={<Typography variant="body2" fontWeight={600}>Account Active (Visible)</Typography>} 
              />
            </Box>
          </Paper>
        )}

        {id && (
          <ActivityHeatmap userId={id} />
        )}

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Basic Info</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 3, mb: 4, pb: 4, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ position: 'relative', '&:hover .remove-photo-btn': { opacity: 1 } }}>
              <Avatar 
                src={form.avatar || undefined} 
                sx={{ width: 96, height: 96, border: 2, borderColor: 'divider', boxShadow: 1 }}
              >
                {!form.avatar && <UserIcon size={40} />}
              </Avatar>
              {form.avatar && (
                <IconButton 
                  className="remove-photo-btn"
                  onClick={handleRemovePhoto} 
                  size="small"
                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, opacity: 0, transition: 'opacity 0.2s', boxShadow: 2 }}
                >
                  <Trash2 size={16} />
                </IconButton>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Profile Picture</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 2, lineHeight: 1.5 }}>
                Upload a high-res JPG or PNG. The server automatically strips EXIF data and dynamically downscales large uploads to securely map into visual coordinates natively.
              </Typography>
              <Button variant="outlined" size="small" startIcon={<UploadCloud size={16} />} onClick={() => fileInputRef.current?.click()}>
                Select & Upload Instantly
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email Address" required={!!id} disabled={!id} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} variant="outlined" size="small" helperText={!id ? 'Contact Admin to change' : ''} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="University" value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Location (City, Country)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} variant="outlined" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Education Level" value={form.educationLevel} onChange={e => setForm({ ...form, educationLevel: e.target.value })} variant="outlined" size="small">
                {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Bio" multiline rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} inputProps={{ maxLength: 300 }} helperText={`${form.bio.length}/300`} variant="outlined" />
            </Grid>
          </Grid>
        </Paper>

        {id ? (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderLeft: 6, borderColor: 'warning.main', bgcolor: 'warning.50' }}>
            <Typography variant="h6" fontWeight={700} color="warning.main" mb={2}>Administrative Security Override</Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ maxWidth: 400 }}>
              <TextField fullWidth label="Set New Password" type="password" placeholder="Leave blank to keep current" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} variant="outlined" size="small" helperText="Updates immediately override established authentication records flawlessly." />
            </Box>
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, borderLeft: 6, borderColor: 'primary.main', bgcolor: 'primary.50' }}>
            <Typography variant="h6" fontWeight={700} color="primary.main" mb={2}>Change Password</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3} sx={{ maxWidth: 800, mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} variant="outlined" size="small" sx={{ bgcolor: 'background.paper' }} />
              </Grid>
              <Grid item xs={12} sm={6} />
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} variant="outlined" size="small" sx={{ bgcolor: 'background.paper' }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} variant="outlined" size="small" sx={{ bgcolor: 'background.paper' }} />
              </Grid>
            </Grid>
            <Button variant="contained" onClick={handlePasswordChange} disabled={changingPassword}>
              {changingPassword ? 'Updating...' : 'Update Password Securely'}
            </Button>
          </Paper>
        )}

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Study Preferences</Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Study Style" value={form.studyStyle} onChange={e => setForm({ ...form, studyStyle: e.target.value })} variant="outlined" size="small">
                {STYLES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel 
                control={<Switch checked={form.preferOnline} onChange={e => setForm({ ...form, preferOnline: e.target.checked })} color="primary" />} 
                label={<Typography variant="body2" fontWeight={600}>Prefer Online Study</Typography>} 
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={3}>Subjects</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField 
              fullWidth placeholder="Add a subject..." value={subjectInput} 
              onChange={e => setSubjectInput(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubject(); } }} 
              variant="outlined" size="small" 
            />
            <Button variant="contained" onClick={() => addSubject()} sx={{ minWidth: '40px', px: 2 }}><Plus size={20} /></Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {SUBJECTS.map(s => (
              <Chip 
                key={s} label={s} onClick={() => addSubject(s)} 
                color={form.subjects.includes(s) ? "primary" : "default"} 
                variant={form.subjects.includes(s) ? "filled" : "outlined"} 
                sx={{ fontWeight: form.subjects.includes(s) ? 700 : 500 }}
              />
            ))}
          </Box>
          {form.subjects.length > 0 && (
            <Box sx={{ pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Selected:</Typography>
              {form.subjects.map(s => (
                <Chip key={s} label={s} onDelete={() => removeSubject(s)} color="primary" variant="filled" size="small" />
              ))}
            </Box>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>Availability</Typography>
            <Button variant="outlined" size="small" startIcon={<Plus size={16} />} onClick={addAvailability}>Add Slot</Button>
          </Box>
          
          <Stack spacing={2}>
            {form.availability.map((slot, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <TextField select value={slot.day} onChange={e => updateAvailability(i, 'day', e.target.value)} variant="outlined" size="small" sx={{ flex: 1, minWidth: 120 }}>
                  {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                <TextField type="time" value={slot.startTime} onChange={e => updateAvailability(i, 'startTime', e.target.value)} variant="outlined" size="small" sx={{ width: 140 }} />
                <Typography variant="body2" color="text.secondary">to</Typography>
                <TextField type="time" value={slot.endTime} onChange={e => updateAvailability(i, 'endTime', e.target.value)} variant="outlined" size="small" sx={{ width: 140 }} />
                <IconButton onClick={() => removeAvailability(i)} color="error"><X size={20} /></IconButton>
              </Box>
            ))}
          </Stack>
          {form.availability.length === 0 && (
            <Typography variant="body2" color="text.disabled" fontStyle="italic">No availability slots added</Typography>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button type="submit" variant="contained" disabled={saving} size="large" sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button type="button" variant="outlined" onClick={() => onComplete ? onComplete() : navigate('/dashboard')} size="large" sx={{ px: 4, fontWeight: 700, borderRadius: 2 }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
