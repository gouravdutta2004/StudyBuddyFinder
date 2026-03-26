import React from 'react';
import { Box, Typography } from '@mui/material';

export default function SquadStudyRoom({ groupId, name }) {
  // We use Jitsi Meet API via public iframe, scoped safely to the squad ID.
  const roomName = `StudyFriend_Squad_${groupId}`;
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f1f5f9', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary">Secure Video Room for {name}</Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 600 }}>
        <iframe
          src={`https://meet.jit.si/${roomName}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          style={{ width: '100%', height: '100%', border: 0 }}
          title={`Squad Virtual Room - ${name}`}
        />
      </Box>
    </Box>
  );
}
