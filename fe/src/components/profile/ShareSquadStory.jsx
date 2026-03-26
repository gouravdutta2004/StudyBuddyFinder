import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Instagram, Download, X } from 'lucide-react';
import { Modal, Box, Typography, Button, IconButton, Avatar, AvatarGroup } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ShareSquadStory({ connections }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [generating, setGenerating] = useState(false);
  const storyRef = useRef(null);

  const handleGenerate = async () => {
    if (!connections || connections.length === 0) {
      return toast.error("You need connections to share your squad!");
    }
    setOpen(true);
    setGenerating(true);
    
    setTimeout(async () => {
      try {
        if (storyRef.current) {
          const dataUrl = await toPng(storyRef.current, { 
            cacheBust: true, 
            pixelRatio: 2, 
            skipFonts: false, 
            useCORS: true 
          });
          setImageSrc(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate story image', err);
        toast.error('Failed to generate image');
      } finally {
        setGenerating(false);
      }
    }, 500); // Small delay to let fonts and DOM render
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.download = 'study-squad-story.png';
    link.href = imageSrc;
    link.click();
    toast.success('Downloaded! Ready for Instagram.');
    setOpen(false);
  };

  return (
    <>
      <Button 
        variant="contained" 
        startIcon={<Instagram size={18} />} 
        onClick={handleGenerate}
        sx={{ 
          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
          color: 'white',
          fontWeight: 800,
          borderRadius: 2,
          '&:hover': {
            filter: 'brightness(1.1)'
          }
        }}
      >
        Share Squad Story
      </Button>

      {/* Hidden DOM element strictly for HTML-to-Image rendering, size optimized for IG Stories (1080x1920 scaled down) */}
      <Box sx={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <Box 
          ref={storyRef}
          sx={{ 
            width: 400, height: 711, // 9:16 aspect ratio
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            p: 4, position: 'relative', overflow: 'hidden', color: 'white', fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* Decorative Orbs */}
          <Box sx={{ position: 'absolute', top: '-10%', left: '-20%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', bottom: '-10%', right: '-20%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)', borderRadius: '50%' }} />

          <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 3, mb: 1, color: '#a78bfa', zIndex: 10 }}>STUDY SQUAD 2026</Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 4, textAlign: 'center', lineHeight: 1.1, zIndex: 10 }}>
            {user?.name}'s<br/>Genius Circle
          </Typography>

          <AvatarGroup max={6} sx={{ mb: 4, zIndex: 10, '& .MuiAvatar-root': { width: 80, height: 80, border: '4px solid #1e1b4b', fontSize: 32, fontWeight: 800 } }}>
            <Avatar sx={{ bgcolor: '#4f46e5' }}>{user?.name?.[0] || 'U'}</Avatar>
            {connections?.slice(0, 5).map(c => (
              <Avatar key={c._id} sx={{ bgcolor: '#ec4899' }}>{c.name?.[0] || 'C'}</Avatar>
            ))}
          </AvatarGroup>

          <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', p: 3, borderRadius: 4, width: '100%', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
            <Typography variant="h6" fontWeight={800} mb={2} textAlign="center">Top Subjects</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {Array.from(new Set([ ...(user?.subjects || []), ...(connections?.flatMap(c => c.subjects) || []) ])).slice(0, 6).map(sub => (
                <Typography key={sub} variant="body2" sx={{ bgcolor: 'rgba(99,102,241,0.2)', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, color: '#c7d2fe' }}>
                  {sub}
                </Typography>
              ))}
            </Box>
          </Box>

          <Box sx={{ position: 'absolute', bottom: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.7 }}>studyfriend.com/join</Typography>
          </Box>
        </Box>
      </Box>

      {/* Preview Modal */}
      <Modal open={open} onClose={() => setOpen(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
        <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 4, outline: 'none', maxWidth: 450, w: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconButton onClick={() => setOpen(false)} sx={{ position: 'absolute', top: 8, right: 8 }}><X /></IconButton>
          <Typography variant="h6" fontWeight={800} mb={2}>Your Insta-Story is Ready!</Typography>
          
          {generating ? (
            <Box sx={{ width: 200, height: 355, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography fontWeight={700} color="text.secondary" className="animate-pulse">Rendering...</Typography>
            </Box>
          ) : (
            <img src={imageSrc} alt="Squad Story" style={{ width: 250, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', marginBottom: 24 }} />
          )}

          <Button 
            variant="contained" 
            fullWidth 
            size="large" 
            startIcon={<Download />} 
            onClick={handleDownload} 
            disabled={generating}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            Download Image
          </Button>
        </Box>
      </Modal>
    </>
  );
}
