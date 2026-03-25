import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Avatar, useTheme, Dialog, DialogTitle, DialogContent, TextField, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Gift, Plus } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BountiesWidget() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [bounties, setBounties] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [rewardPoints, setRewardPoints] = useState(100);

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    try {
      const res = await api.get('/gamification/bounties');
      setBounties(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title) return;
    try {
      const res = await api.post('/gamification/bounties', { title, rewardPoints });
      setBounties([...bounties, res.data]);
      setOpen(false);
      setTitle('');
      setRewardPoints(100);
      toast.success('Bounty Broadcasted!');
    } catch (err) {
      toast.error('Failed to create bounty');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={900} display="flex" alignItems="center" gap={1.5}>
          <Target size={20} color="#f43f5e" /> Active Bounties
        </Typography>
        <Button onClick={() => setOpen(true)} size="small" variant="contained" sx={{ bgcolor: '#f43f5e', '&:hover': { bgcolor: '#e11d48' }, borderRadius: '100px', fontWeight: 800 }}>
          <Plus size={16} /> Post
        </Button>
      </Box>

      {bounties.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3, opacity: 0.5 }}>
          <Typography variant="body2" fontWeight={600}>No active bounties in the matrix.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AnimatePresence>
            {bounties.map(bounty => (
              <motion.div key={bounty._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2,
                  borderRadius: '20px', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f8f9fa', border: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.05)',
                  '&:hover': { borderColor: '#f43f5e', bgcolor: isDark ? 'rgba(244, 63, 94, 0.05)' : 'rgba(244, 63, 94, 0.05)' }
                }}>
                  <Avatar src={bounty.creatorId?.avatar} sx={{ width: 44, height: 44, bgcolor: '#f43f5e', fontWeight: 900 }}>
                    {bounty.creatorId?.name?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" fontWeight={800} noWrap>{bounty.title}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>
                      By {bounty.creatorId?.name}
                    </Typography>
                  </Box>
                  <Chip icon={<Gift size={14} color="#f43f5e" />} label={`${bounty.rewardPoints} XP`} sx={{ bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontWeight: 800, borderRadius: 2 }} />
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1, minWidth: 320, bgcolor: isDark ? '#1e293b' : 'white' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Broadcast Bounty</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Objective (e.g. Help me understand React Hooks)" value={title} onChange={e => setTitle(e.target.value)} required />
            <TextField fullWidth label="Reward Points (XP)" type="number" inputProps={{ min: 10, max: 1000, step: 10 }} value={rewardPoints} onChange={e => setRewardPoints(e.target.value)} required />
            <Button type="submit" variant="contained" sx={{ bgcolor: '#f43f5e', mt: 1, '&:hover': { bgcolor: '#e11d48' }, py: 1.5, fontWeight: 800, borderRadius: '12px' }}>Broadcast</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
