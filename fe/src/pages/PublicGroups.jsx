import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Button, TextField, Grid, Chip, Avatar, CircularProgress, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel, IconButton, useTheme, Tooltip } from '@mui/material';
import { Users, Plus, X, Search, ChevronRight, LogOut, Globe, Lock, Shield, Crosshair, Target, Radio, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SUBJECT_OPTIONS = ['CS','Math','Physics','Chemistry','Biology','History','Economics','Literature','Engineering','Psychology','Other'];
const SANS = '"Inter", "Roboto", sans-serif';
const RED = '#ff4655'; // Tactical Neon Red
const RED_GLOW = 'rgba(255, 70, 85, 0.4)';

function SquadCard({ group, isMember, isFull, onJoin, onLeave, navigate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} style={{ height: '100%', willChange: 'transform' }}>
      <Box sx={{
        p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2.5, position: 'relative', overflow: 'hidden',
        bgcolor: isDark ? '#0a0a0a' : '#f8f9fa',
        border: '1px solid', borderColor: isDark ? '#262626' : '#e5e5e5',
        boxShadow: isDark ? `inset 0 0 20px rgba(255,70,85,0.05), 0 8px 24px rgba(0,0,0,0.8)` : `0 8px 24px rgba(0,0,0,0.1)`,
        borderRadius: '0px', 
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)', // Cut corner
        '&:hover': {
          borderColor: RED,
          boxShadow: `0 0 20px ${RED_GLOW}, inset 0 0 10px ${RED_GLOW}`
        },
        transition: 'all 0.3s'
      }}>
        {/* Banner accent */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', bgcolor: RED }} />
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, position: 'relative', zIndex: 1, borderBottom: '1px solid', borderColor: isDark ? '#262626' : '#e5e5e5', pb: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {!group.isPublic ? <Lock size={14} color={RED} /> : <Globe size={14} color={isDark ? '#60a5fa' : '#3b82f6'} />}
              <Typography sx={{ fontFamily: SANS, fontWeight: 900, fontSize: '1.25rem', color: isDark ? '#fff' : '#0a0a0a', letterSpacing: -0.5, lineHeight: 1.1, textTransform: 'uppercase' }} noWrap>
                {group.name}
              </Typography>
            </Box>
            {group.createdBy?.name && (
              <Typography sx={{ fontSize: '0.65rem', fontFamily: 'monospace', color: isDark ? '#737373' : '#a3a3a3', fontWeight: 700, letterSpacing: 1 }}>
                CMD: {group.createdBy.name.toUpperCase()}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: isDark ? 'rgba(255,70,85,0.1)' : 'rgba(255,70,85,0.05)', border: `1px solid ${RED}`, px: 1, py: 0.25, transform: 'skewX(-10deg)', flexShrink: 0 }}>
            <Typography sx={{ fontFamily: 'monospace', color: RED, fontWeight: 900, fontSize: '0.65rem', letterSpacing: 1, transform: 'skewX(10deg)' }}>{group.subject.toUpperCase()}</Typography>
          </Box>
        </Box>

        {/* Description */}
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <Typography sx={{ fontFamily: SANS, fontSize: '0.9rem', color: isDark ? '#a3a3a3' : '#525252', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {group.description}
          </Typography>
        </Box>

        {/* Squad Capacity */}
        <Box sx={{ position: 'relative', zIndex: 1, bgcolor: isDark ? '#111' : '#fdfdfd', p: 1.5, border: '1px solid', borderColor: isDark ? '#262626' : '#e5e5e5' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: isDark ? '#737373' : '#a3a3a3', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, letterSpacing: 1 }}>
              <Users size={12} color={RED} /> OPACITY
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: isFull ? RED : (isDark ? '#fff' : '#0a0a0a'), fontSize: '1rem' }}>
              {group.members.length}/{group.maxMembers}
            </Typography>
          </Box>
          <Box sx={{ height: 4, bgcolor: isDark ? '#262626' : '#e5e5e5', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${Math.min((group.members.length / group.maxMembers) * 100, 100)}%`, bgcolor: isFull ? '#7f1d1d' : RED, transition: 'width 0.5s ease' }} />
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', position: 'relative', zIndex: 1 }}>
          {isMember ? (
            <>
              <Button fullWidth onClick={() => navigate(`/groups/${group._id}`)} endIcon={<ChevronRight size={16} />} sx={{ borderRadius: 0, textTransform: 'uppercase', fontFamily: SANS, fontWeight: 900, letterSpacing: 1, color: '#fff', bgcolor: RED, '&:hover': { bgcolor: '#ff2a3f' } }}>
                Enter Hub
              </Button>
              <Tooltip title="Leave Squad">
                <IconButton onClick={() => onLeave(group._id)} sx={{ borderRadius: 0, bgcolor: isDark ? '#1a1a1a' : '#f5f5f5', border: '1px solid', borderColor: isDark ? '#333' : '#ddd', color: '#ff4655', '&:hover': { bgcolor: isDark ? '#333' : '#e5e5e5' } }}>
                  <LogOut size={18} />
                </IconButton>
              </Tooltip>
            </>
          ) : isFull ? (
            <Box sx={{ flex: 1, textAlign: 'center', py: 1, border: `1px dashed ${RED}88`, bgcolor: `${RED}11` }}>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: RED, letterSpacing: 1, fontSize: '0.8rem' }}>SQUAD FULL</Typography>
            </Box>
          ) : (
            <Button fullWidth onClick={() => onJoin(group._id)} startIcon={<Target size={16} />} sx={{ borderRadius: 0, textTransform: 'uppercase', fontFamily: SANS, fontWeight: 900, letterSpacing: 1, color: isDark ? '#fff' : '#000', border: '1px solid', borderColor: isDark ? '#444' : '#ccc', '&:hover': { borderColor: RED, color: RED, bgcolor: `${RED}11` } }}>
              Deploy
            </Button>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

export default function PublicGroups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', subject: '', maxMembers: 10, isPublic: true });
  const [creating, setCreating] = useState(false);

  const plan = user?.subscription?.plan || 'basic';
  const maxAllowedMembers = plan === 'squad' ? 50 : plan === 'pro' ? 20 : 10;

  const fetchGroups = async () => {
    try { const res = await api.get(`/groups?search=${search}`); setGroups(res.data); }
    catch { toast.error('Failed to summon squads'); } finally { setLoading(false); }
  };
  useEffect(() => { const timer = setTimeout(fetchGroups, 400); return () => clearTimeout(timer); }, [search]); // eslint-disable-line

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      await api.post('/groups', { ...form, maxMembers: Math.min(form.maxMembers, maxAllowedMembers) });
      toast.success('Squad Deployed', { icon: '🎯' }); setShowForm(false);
      setForm({ name: '', description: '', subject: '', maxMembers: maxAllowedMembers, isPublic: true }); fetchGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Deployment failed'); } finally { setCreating(false); }
  };
  const handleJoin = async (id) => { try { await api.post(`/groups/${id}/join`); toast.success('Deployed!', { icon: '⚔️' }); fetchGroups(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };
  const handleLeave = async (id) => { try { await api.post(`/groups/${id}/leave`); toast.success('Squad Left'); fetchGroups(); } catch (err) { toast.error('Failed'); } };

  const inputSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 0, fontFamily: 'monospace', bgcolor: isDark ? '#111' : '#fff', '& fieldset': { borderColor: isDark ? '#333' : '#ccc' }, '&:hover fieldset': { borderColor: RED }, '&.Mui-focused fieldset': { borderColor: RED, borderWidth: 1 } },
    '& .MuiInputLabel-root': { fontFamily: 'monospace', color: isDark ? '#737373' : '#a3a3a3', fontWeight: 600, letterSpacing: 1 }, '& .MuiInputLabel-root.Mui-focused': { color: RED },
    '& input, & textarea, & .MuiSelect-select': { color: isDark ? '#fff' : '#000', fontWeight: 500 }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 6, px: { xs: 2, md: 4 }, bgcolor: isDark ? '#050505' : '#f0f0f0', backgroundImage: isDark ? 'radial-gradient(circle at 50% 0, rgba(255, 70, 85, 0.05), transparent 60%)' : 'none' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 6, flexWrap: 'wrap', gap: 3, borderBottom: '1px solid', borderColor: isDark ? '#333' : '#ddd', pb: 2 }}>
          <Box>
            <Typography sx={{ fontFamily: SANS, fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, color: isDark ? '#fff' : '#000', letterSpacing: -1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
               <Crosshair size={36} color={RED} /> Squad Deployments
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: RED, display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, letterSpacing: 2 }}>
               STATUS: ONLINE // AWAITING ORDERS
            </Typography>
          </Box>
          <Button onClick={() => setShowForm(true)} startIcon={<Terminal size={16} />} sx={{ borderRadius: 0, textTransform: 'uppercase', fontFamily: SANS, fontWeight: 900, letterSpacing: 1, px: 3, py: 1.25, color: '#000', bgcolor: RED, '&:hover': { bgcolor: '#ff2a3f' } }}>
            Establish Squad
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ position: 'relative', mb: 6 }}>
          <TextField fullWidth placeholder="SCAN REGISTRY..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={18} color={RED} /></InputAdornment> }}
            sx={{ ...inputSx, '& .MuiOutlinedInput-root': { ...inputSx['& .MuiOutlinedInput-root'], py: 0.5 } }}
          />
          <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, bgcolor: RED }} />
        </Box>

        {/* Squad Grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={40} sx={{ color: RED }} /></Box>
        ) : groups.length === 0 ? (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ textAlign: 'center', py: 12, bgcolor: isDark ? '#0a0a0a' : '#fff', border: '1px dashed', borderColor: isDark ? '#333' : '#ccc' }}>
            <Radio size={48} color={RED} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <Typography sx={{ fontFamily: SANS, fontWeight: 900, fontSize: '1.25rem', color: isDark ? '#fff' : '#000', textTransform: 'uppercase', letterSpacing: 1 }}>No Squads Found</Typography>
            <Typography sx={{ fontFamily: 'monospace', color: isDark ? '#737373' : '#a3a3a3', fontSize: '0.8rem', mt: 1 }}>Radar is empty. Initiate protocol to establish a new unit.</Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <AnimatePresence mode="popLayout">
              {groups.map(g => (
                <Grid item xs={12} sm={6} lg={4} key={g._id}>
                  <SquadCard group={g} isMember={g.members.includes(user?._id)} isFull={g.members.length >= g.maxMembers} onJoin={handleJoin} onLeave={handleLeave} navigate={navigate} />
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Box>

      {/* Found Squad Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 0, bgcolor: isDark ? '#0a0a0a' : '#fff', border: `1px solid ${RED}` } }}>
        <DialogTitle sx={{ pb: 2, pt: 3, px: 4, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: isDark ? '#333' : '#eee' }}>
          <Box>
            <Typography sx={{ fontFamily: SANS, fontWeight: 900, fontSize: '1.5rem', color: isDark ? '#fff' : '#000', textTransform: 'uppercase', letterSpacing: -0.5 }}>Initialize Squad</Typography>
            <Typography sx={{ fontFamily: 'monospace', color: RED, mt: 0.5, fontSize: '0.75rem', letterSpacing: 1 }}>AWAITING PROTOCOL PARAMETERS</Typography>
          </Box>
          <IconButton onClick={() => setShowForm(false)} sx={{ color: RED, alignSelf: 'flex-start' }}><X size={24} /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 4, pt: 4, pb: 2 }}>
          <Box component="form" id="create-squad-form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField label="SQUAD DESIGNATION" required fullWidth value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alpha Company" sx={inputSx} />
            <FormControl fullWidth sx={inputSx}>
              <InputLabel>PRIMARY DIRECTIVE *</InputLabel>
              <Select label="PRIMARY DIRECTIVE *" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                {SUBJECT_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', textTransform: 'uppercase' }}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="MISSION BRIEF" required fullWidth multiline rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="State operational goals." sx={inputSx} />

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', bgcolor: isDark ? '#111' : '#f9f9f9', p: 2, border: '1px solid', borderColor: isDark ? '#333' : '#e5e5e5' }}>
              <TextField label="MAX CAP" type="number" size="small" value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: Math.min(Math.max(2, +e.target.value), maxAllowedMembers) })} InputProps={{ inputProps: { min: 2, max: maxAllowedMembers } }} sx={{ width: 100, ...inputSx }} />
              <Box sx={{ flex: 1 }}>
                <FormControlLabel
                  control={<Switch checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: RED }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: RED } }} />}
                  label={<Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: isDark ? '#fff' : '#000', fontSize: '0.8rem' }}>
                    {form.isPublic ? 'PUBLIC (OPEN FREQUENCY)' : 'PRIVATE (ENCRYPTED)'}
                  </Typography>}
                />
              </Box>
              {plan === 'basic' && <Chip icon={<Shield size={12} color="#555" />} label={`CAP: ${maxAllowedMembers}`} size="small" sx={{ fontFamily: 'monospace', fontWeight: 900, bgcolor: isDark ? '#222' : '#eee', color: isDark ? '#aaa' : '#555', border: '1px solid', borderColor: isDark ? '#444' : '#ccc', borderRadius: 0 }} />}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 4, mt: 1, gap: 2 }}>
          <Button onClick={() => setShowForm(false)} fullWidth variant="outlined" sx={{ borderRadius: 0, fontFamily: SANS, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: isDark ? '#fff' : '#000', borderColor: isDark ? '#444' : '#ccc', '&:hover': { borderColor: isDark ? '#fff' : '#000' } }}>
            Abort
          </Button>
          <Button type="submit" form="create-squad-form" fullWidth variant="contained" disabled={creating} sx={{ borderRadius: 0, fontFamily: SANS, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#000', bgcolor: RED, '&:hover': { bgcolor: '#ff2a3f' } }}>
            {creating ? 'DEPLOYING...' : 'CONFIRM DEPLOYMENT'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
