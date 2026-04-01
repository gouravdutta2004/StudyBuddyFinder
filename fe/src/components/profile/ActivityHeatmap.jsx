import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, Button } from '@mui/material';
import api from '../../api/axios';
import { Calendar, RefreshCw, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ActivityHeatmap = React.memo(function ActivityHeatmap({ userId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeDates, setActiveDates] = useState([]);
  const [syncing, setSyncing] = useState(false);
  
  const isBasic = user?.subscription?.plan === 'basic';

  const handleGithubSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/users/sync-github');
      setActiveDates(res.data.activityLog.map(d => new Date(d).toISOString().split('T')[0]));
      toast.success(res.data.message || 'GitHub heatmap synced successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'GitHub sync failed');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await api.get(`/activity/heatmap/${userId}`);
        setActiveDates(res.data.map(d => new Date(d).toISOString().split('T')[0]));
      } catch (err) {}
    };
    if (userId) fetchHeatmap();
  }, [userId]);

  // Generate last 200 days for mobile compatibility
  const today = new Date();
  const days = [];
  for (let i = 199; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  return (
    <Card sx={{ p: 3, borderRadius: 4, mt: 3, width: '100%', overflow: 'hidden', position: 'relative' }}>
      
      {isBasic && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 10, display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center'
        }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Lock size={24} color="#6366f1" />
          </Box>
          <Typography variant="h6" fontWeight={800} mb={1}>Advanced Heatmaps locked</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Pro users can sync their GitHub activity and track detailed study velocity.
          </Typography>
          <Button 
            variant="contained"
            onClick={() => navigate('/billing')}
            sx={{ bgcolor: '#6366f1', color: 'white', px: 3, borderRadius: '100px', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            Upgrade
          </Button>
        </Box>
      )}

      <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1} mb={2}>
        <Calendar size={20} color="#10b981" /> Study Habit Matrix
        {userId === user?._id && (
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleGithubSync} 
            disabled={syncing} 
            startIcon={<RefreshCw size={14} className={syncing ? "animate-spin" : ""} />} 
            sx={{ ml: 'auto', borderRadius: 2 }}
          >
            {syncing ? 'Syncing...' : 'Sync GitHub'}
          </Button>
        )}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', width: '100%' }}>
        {days.map(day => {
          const count = activeDates.filter(d => d === day).length; // Though currently array of distinct dates mostly
          const isActive = count > 0;
          return (
            <Box 
              key={day} 
              title={day}
              sx={{ 
                width: 14, height: 14, borderRadius: '4px',
                bgcolor: isActive ? '#10b981' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#e5e7eb',
                opacity: isActive ? Math.min(0.5 + (count * 0.2), 1) : 1
              }} 
            />
          );
        })}
      </Box>
    </Card>
  );
});

export default ActivityHeatmap;
