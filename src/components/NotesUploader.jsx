import React, { useState } from 'react';
import api from '../api/axios';
import { Paperclip, UploadCloud, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { Box, Paper, Typography, Button, Divider, useTheme, Card, CardActionArea, CardContent, Avatar } from '@mui/material';

export default function NotesUploader({ session, setSession }) {
  const [uploading, setUploading] = useState(false);
  const theme = useTheme();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { url, name } = uploadRes.data;

      const notesRes = await api.post(`/sessions/${session._id}/notes`, {
        url, name
      });
      
      setSession({ ...session, notes: notesRes.data });
      toast.success('Note uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload note');
    } finally {
      setUploading(false);
      e.target.value = null; // reset input
    }
  };

  return (
    <Paper elevation={theme.palette.mode === 'dark' ? 4 : 1} sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={800} color="text.primary" display="flex" alignItems="center" gap={1}>
          <Paperclip size={20} color={theme.palette.primary.main} />
          Shared Notes
        </Typography>
        
        <Button
          component="label"
          variant="contained"
          size="small"
          disabled={uploading}
          startIcon={<UploadCloud size={16} />}
          sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            hidden
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          />
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ flex: 1, maxHeight: 200, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {!session.notes || session.notes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={4}>
            No notes shared yet.
          </Typography>
        ) : (
          session.notes.map((note, idx) => (
            <Card key={idx} variant="outlined" sx={{ borderRadius: 3, bgcolor: 'background.default', '&:hover': { borderColor: 'primary.main' } }}>
              <CardActionArea href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${note.url}`} target="_blank" rel="noreferrer" sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', color: 'primary.main', width: 40, height: 40, borderRadius: 2 }}>
                    <FileText size={20} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                      {note.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      Shared by {note.uploadedBy}
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          ))
        )}
      </Box>
    </Paper>
  );
}
