import React, { useEffect, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ActivityHeatmap() {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    if (user?._id) {
      api.get(`/activity/heatmap/${user._id}`)
        .then(res => setActivityData(res.data))
        .catch(() => {});
    }
  }, [user]);

  // Generate last 365 days
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);

  // Group timestamps by YYYY-MM-DD
  const countsByDate = activityData.reduce((acc, timestamp) => {
    const d = new Date(timestamp).toISOString().split('T')[0];
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const weeks = [];
  let currentWeek = [];
  
  // Align start to the correct day of the week
  const startDayPadding = startDate.getDay();
  for (let i = 0; i < startDayPadding; i++) {
    currentWeek.push(null);
  }

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    currentWeek.push({
      date: dateStr,
      count: countsByDate[dateStr] || 0
    });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  // Push remaining days in final week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const getColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.05)';
    if (count < 3) return 'rgba(16, 185, 129, 0.4)';
    if (count < 6) return 'rgba(16, 185, 129, 0.7)';
    return 'rgba(16, 185, 129, 1)';
  };

  return (
    <Box sx={{ 
      p: 4, bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Network size={20} color="#10b981" />
        </Box>
        <Typography variant="h6" fontWeight="800" color="white">Velocity Heatmap</Typography>
      </Box>

      <Box sx={{ overflowX: 'auto', pb: 2 }}>
        <Box sx={{ display: 'flex', gap: '4px', minWidth: '800px' }}>
          {weeks.map((week, wIdx) => (
            <Box key={wIdx} sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {week.map((day, dIdx) => {
                if (!day) return <Box key={`empty-${wIdx}-${dIdx}`} sx={{ width: 14, height: 14, borderRadius: '4px' }} />;
                
                return (
                  <Tooltip key={day.date} title={`${day.count} activities on ${day.date}`} placement="top" arrow>
                    <motion.div
                      whileHover={{ scale: 1.2, zIndex: 10 }}
                      style={{ 
                        width: 14, height: 14, borderRadius: '4px', cursor: 'pointer',
                        backgroundColor: getColor(day.count)
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 2, mb: 1 }}>
        <Typography variant="caption" color="rgba(255,255,255,0.5)">Less</Typography>
        <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'rgba(16, 185, 129, 0.4)' }} />
        <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'rgba(16, 185, 129, 0.7)' }} />
        <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: 'rgba(16, 185, 129, 1)' }} />
        <Typography variant="caption" color="rgba(255,255,255,0.5)">More</Typography>
      </Box>
    </Box>
  );
}
