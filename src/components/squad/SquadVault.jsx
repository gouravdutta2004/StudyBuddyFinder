import React, { useState, useRef } from 'react';
import { Box, Typography, Button, TextField, Paper, Select, MenuItem, Grid, IconButton } from '@mui/material';
import { Upload, FileText, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import api from "../../api/axios";
import toast from 'react-hot-toast';



const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUpSpring = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function SquadVault({ groupId, initialResources = [] }) {
  const [resources, setResources] = useState(initialResources);
  const [form, setForm] = useState({ title: '', url: '', type: 'link' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
      
      const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
      const fileUrl = `${wsUrl}${uploadRes.data.url}`; // Ensure absolute backend URL for now

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
    </Box>
  );
}
