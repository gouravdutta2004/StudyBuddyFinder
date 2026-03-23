import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import { Activity } from 'lucide-react';
import api from '../../api/axios';

export default function GlobalActivityFeed() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/activity/global');
        setLogs(res.data);
      } catch (err) {}
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card sx={{ borderRadius: 4, height: '100%', maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1} mb={2}>
          <Activity size={20} color="#8b5cf6" /> Live Community Link
        </Typography>
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pr: 1 }}>
          {logs.map(log => (
            <Box key={log._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
              <Avatar src={log.userId?.avatar} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                 {log.userId?.name?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">{log.description}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleString()}</Typography>
              </Box>
            </Box>
          ))}
          {logs.length === 0 && <Typography variant="caption" color="text.secondary" align="center" mt={2}>No recent activity detected.</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}
