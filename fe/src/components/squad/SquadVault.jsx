import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, Paper, Select, MenuItem, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Fab, Tooltip, CircularProgress } from '@mui/material';
import { Upload, FileText, Link as LinkIcon, Download, Loader2, Folder, Sparkles, X, Send, Bot } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import api from "../../api/axios";
import toast from 'react-hot-toast';



const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUpSpring = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function SquadVault({ groupId, initialResources = [] }) {
  const [resources, setResources] = useState(initialResources);
  const [form, setForm] = useState({ title: '', url: '', type: 'link' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // AI Tutor State
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', content: "Hi! I'm your squad's AI Tutor. Ask me any questions about the subjects you're currently studying!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  const handleAskTutor = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt.trim();
    setPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const res = await api.post('/ai/squad-tutor', {
        prompt: userMsg,
        squadName: "Your Squad",
        subject: "your shared resources"
      });
      setChatHistory(prev => [...prev, { role: 'model', content: res.data.text }]);
    } catch (err) {
      toast.error('AI Tutor failed to connect!');
    } finally {
      setIsTyping(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload to backend multer `/api/upload`
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Cloudinary returns an absolute URL natively
      const fileUrl = uploadRes.data.url;

      // 2. Save resource to Group
      const res = await api.post(`/groups/${groupId}/resources`, {
        id: Date.now().toString(),
        title: uploadRes.data.name,
        url: fileUrl,
        type: file.type.includes('pdf') ? 'pdf' : 'other'
      });
      setResources([...resources, res.data]);
      toast.success('File uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = null; // reset
    }
  };

  const addLink = async (e) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    try {
      const res = await api.post(`/groups/${groupId}/resources`, {
        id: Date.now().toString(),
        ...form
      });
      setResources([...resources, res.data]);
      setForm({ title: '', url: '', type: 'link' });
      toast.success('Link shared!');
    } catch (err) {
      toast.error('Failed to share link');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#020617', minHeight: '600px', borderRadius: '32px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="900" color="white">Resource Vault</Typography>
        <Button 
          variant="contained" 
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          startIcon={isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          sx={{ borderRadius: '100px', px: 3, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 800 }}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
        <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
      </Box>
      
      {/* Link Sharing Bar */}
      <Box component="form" onSubmit={addLink} sx={{ display: 'flex', gap: 2, mb: 6, bgcolor: 'rgba(255,255,255,0.03)', p: 2, borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Select size="small" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} sx={{ width: 140, color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}>
          <MenuItem value="link">Web Link</MenuItem>
          <MenuItem value="pdf">External PDF</MenuItem>
          <MenuItem value="other">Other Link</MenuItem>
        </Select>
        <TextField size="small" placeholder="Resource Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required sx={{ input: { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }} />
        <TextField size="small" fullWidth placeholder="URL (https://...)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} required sx={{ input: { color: 'white' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }} />
        <Button type="submit" variant="outlined" startIcon={<LinkIcon size={18} />} sx={{ borderRadius: '100px', color: 'white', borderColor: 'rgba(255,255,255,0.3)', textTransform: 'none', fontWeight: 700 }}>Save Link</Button>
      </Box>

      {/* Resources Grid */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
        <Grid container spacing={3}>
          {resources.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ py: 10, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '32px' }}>
                <Folder size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 16px' }} />
                <Typography color="rgba(255,255,255,0.5)">The Vault is empty. Upload PDFs or share links securely.</Typography>
              </Box>
            </Grid>
          ) : (
            resources.map((r, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <motion.div variants={fadeUpSpring} style={{ height: '100%' }}>
                  <Box sx={{ 
                    p: 3, display: 'flex', flexDirection: 'column', height: '100%',
                    bgcolor: 'background.paper', borderRadius: '16px',
                    border: '1px solid', borderColor: 'divider',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: r.type === 'link' ? 'primary.light' : 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      {r.type === 'link' ? <LinkIcon size={24} color="#1e40af" /> : <FileText size={24} color="#991b1b" />}
                    </Box>
                    <Typography fontWeight="800" color="text.primary" sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Button component="a" href={r.url} target="_blank" rel="noopener noreferrer" fullWidth variant="outlined" sx={{ borderRadius: '100px', textTransform: 'none', fontWeight: 700 }} endIcon={<Download size={16} />}>
                        Access
                      </Button>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))
          )}
        </Grid>
      </motion.div>

      {/* Floating Action Button */}
      <Tooltip title="Ask AI Tutor" placement="left">
        <Fab 
          color="primary" 
          aria-label="ai tutor"
          onClick={() => setIsTutorOpen(true)}
          sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32, 
            bgcolor: '#6366f1', 
            '&:hover': { bgcolor: '#4f46e5' },
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Sparkles />
        </Fab>
      </Tooltip>

      {/* AI Tutor Dialog */}
      <Dialog 
        open={isTutorOpen} 
        onClose={() => setIsTutorOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0f172a',
            backgroundImage: 'none',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={24} color="#818cf8" />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight="800" color="white" lineHeight={1.2}>Squad AI Tutor</Typography>
            <Typography variant="caption" color="text.secondary">Powered by Whobee AI</Typography>
          </Box>
          <IconButton onClick={() => setIsTutorOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '400px', display: 'flex', flexDirection: 'column', bgcolor: '#020617' }}>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chatHistory.map((msg, idx) => (
              <Box key={idx} sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <Paper sx={{ 
                  p: 2, borderRadius: 3, 
                  bgcolor: msg.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.05)', 
                  color: 'white', border: msg.role === 'model' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 24,
                  borderBottomLeftRadius: msg.role === 'model' ? 4 : 24,
                }}>
                  {msg.role === 'model' ? (
                    <Box sx={{ '& p': { m: 0, mb: 1 }, '& p:last-child': { mb: 0 }, '& code': { bgcolor: 'rgba(0,0,0,0.3)', px: 1, borderRadius: 1 } }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </Box>
                  ) : (
                    <Typography variant="body2">{msg.content}</Typography>
                  )}
                </Paper>
              </Box>
            ))}
            {isTyping && (
              <Box sx={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                <Paper sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderBottomLeftRadius: 4 }}>
                  <Box display="flex" gap={1} alignItems="center">
                     <CircularProgress size={14} thickness={6} sx={{ color: '#818cf8' }}/>
                     <Typography variant="caption" fontWeight={700}>Tutor is reading...</Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            <div ref={chatBottomRef} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(255,255,255,0.02)' }}>
          <TextField
            fullWidth
            placeholder="Ask about your study materials..."
            variant="outlined"
            size="small"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskTutor()}
            disabled={isTyping}
            sx={{ 
              input: { color: 'white' }, 
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 3,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              }
            }}
          />
          <IconButton 
            onClick={handleAskTutor} 
            disabled={!prompt.trim() || isTyping}
            sx={{ bgcolor: '#6366f1', color: 'white', '&:hover': { bgcolor: '#4f46e5' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' } }}
          >
            <Send size={18} />
          </IconButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
