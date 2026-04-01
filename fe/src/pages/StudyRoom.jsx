import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NotesUploader from '../components/NotesUploader';
import VideoRoom from '../components/VideoRoom';
import SharedWhiteboard from '../components/SharedWhiteboard';
import StudyRoomChat from '../components/StudyRoomChat';
import { ArrowLeft, Users, Loader2, Maximize, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Box, Typography, IconButton, Button, useTheme } from '@mui/material';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

export default function StudyRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [socket, setSocket] = useState(null);
  const whiteboardRef = useRef(null);

  useEffect(() => {
    const fetchSessionAndJoin = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        const found = res.data;
        
        if (!found) {
          toast.error("Session not found");
          return navigate('/sessions');
        }

        const isParticipant = found.participants?.some(p => p._id === user?._id || p === user?._id);
        const isHost = found.host?._id === user?._id || found.host === user?._id;

        if (!isParticipant && !isHost) {
          try {
            await api.post(`/sessions/${id}/join`);
            toast.success("Automatically joined the session via direct link!");
            const joinedRes = await api.get(`/sessions/${id}`);
            setSession(joinedRes.data);
          } catch (joinErr) {
            toast.error(joinErr.response?.data?.message || "Session is full or unavailable.");
            return navigate('/sessions');
          }
        } else {
          setSession(found);
        }

      } catch (err) {
        console.error("StudyRoom Load Error:", err);
        toast.error(err.response?.data?.message || err.message || 'Failed to load study room or verify permissions');
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchSessionAndJoin();
    }
  }, [id, navigate, user]);

  useEffect(() => {
    if (!session) return;
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    const newSocket = io(wsUrl, { withCredentials: true });
    newSocket.emit('join_study_room', id);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [id, session]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && whiteboardRef.current) {
      whiteboardRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: isDark ? '#0f0f11' : '#f8f9fa' }}>
        <Loader2 className="animate-spin text-blue-500" size={40} color={isDark ? '#fff' : '#000'} />
      </Box>
    );
  }
  if (!session) return null;

  // Colors for Canvas Toolbar/UI
  const surfaceColor = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const textMuted = isDark ? '#a1a1aa' : '#71717a';

  return (
    <Box sx={{ 
      display: 'flex', height: '100vh', 
      bgcolor: isDark ? '#121212' : '#f0f2f5', 
      backgroundImage: `radial-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
      backgroundSize: '24px 24px', // The Dot Grid
      color: textColor, overflow: 'hidden', fontFamily: 'Inter, sans-serif', position: 'relative' 
    }}>
       {/* Main Canvas Area */}
       <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           
           {/* Top Nav Overlay (Figma-style Minimal Toolbar) */}
           <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
               <Box sx={{ 
                 pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 }, 
                 bgcolor: surfaceColor, px: 1, py: 1, borderRadius: '8px', 
                 border: `1px solid ${borderColor}`, 
                 boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)' 
               }}>
                   
                   {/* Left Controls */}
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                     <IconButton size="small" onClick={() => navigate('/sessions')} sx={{ color: textMuted, borderRadius: 1, '&:hover': { bgcolor: isDark ? '#2c2c2c' : '#f4f4f5', color: textColor, transform: 'translateX(-2px)' }, transition: 'all 0.2s' }}><ArrowLeft size={16} /></IconButton>
                     <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: textColor, display: { xs: 'none', sm: 'block' } }}>{session.title}</Typography>
                   </Box>

                   <Box sx={{ width: 1, height: 16, bgcolor: borderColor }} />

                   {/* Center Badge */}
                   <Box sx={{ px: 1.5, py: 0.5, borderRadius: '4px', bgcolor: isDark ? '#27272a' : '#f4f4f5', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                     <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{session.subject}</Typography>
                   </Box>

                   <Box sx={{ width: 1, height: 16, bgcolor: borderColor }} />
                   
                   {/* Right Controls */}
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
                     <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.75, color: textMuted }}>
                        <Users size={14} color={textMuted} /> 
                        <Box component="span">{session.participants?.length || 1} <Box component="span" sx={{ opacity: 0.4 }}>/</Box> {session.maxParticipants || '∞'}</Box>
                     </Typography>
                     <IconButton size="small" onClick={toggleFullscreen} sx={{ color: textMuted, borderRadius: 1, '&:hover': { bgcolor: isDark ? '#2c2c2c' : '#f4f4f5', color: textColor }, transition: 'all 0.2s', ml: 1 }} title="Fullscreen Whiteboard">
                       <Maximize size={14} />
                     </IconButton>
                   </Box>
               </Box>
           </Box>

           {/* Whiteboard occupying the entire background */}
           <Box ref={whiteboardRef} sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: 'transparent' }}>
             {socket && <SharedWhiteboard roomId={id} socket={socket} />}
           </Box>

           {/* Floating Video Dock on the left bottom */}
           <Box sx={{ position: 'absolute', bottom: 32, left: 32, zIndex: 50, pointerEvents: 'none', width: 'auto', maxWidth: 1200 }}>
              {socket && <VideoRoom roomId={id} socket={socket} onTogglePanel={() => setShowPanel(!showPanel)} showPanel={showPanel} />}
           </Box>
       </Box>

       {/* Floating Canvas Inspector Panel */}
       <AnimatePresence>
         {showPanel && (
             <motion.div
               initial={{ x: 400, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               exit={{ x: 400, opacity: 0 }}
               transition={{ type: 'spring', damping: 28, stiffness: 220 }}
               style={{ 
                 position: 'absolute', right: 24, top: 80, bottom: 24, width: 340, 
                 borderRadius: '12px', background: surfaceColor, 
                 border: `1px solid ${borderColor}`, 
                 boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0,0,0,0.1)', 
                 display: 'flex', flexDirection: 'column', zIndex: 60, overflow: 'hidden' 
               }}
             >
               <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'hidden' }}>
                   {/* Tabs Nav */}
                   <Box sx={{ display: 'flex', p: 0.5, bgcolor: isDark ? '#27272a' : '#f4f4f5', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
                     <Button 
                       fullWidth 
                       onClick={() => setActiveTab('chat')} 
                       sx={{ 
                         borderRadius: '6px', 
                         bgcolor: activeTab === 'chat' ? (isDark ? '#3f3f46' : '#ffffff') : 'transparent', 
                         color: activeTab === 'chat' ? textColor : textMuted, 
                         py: 0.75, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, 
                         boxShadow: activeTab === 'chat' ? (isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)') : 'none',
                         transition: 'all 0.2s', '&:hover': { bgcolor: activeTab === 'chat' ? undefined : (isDark ? '#3f3f46' : '#e4e4e7') } 
                       }}
                     >
                       <MessageSquare size={14} style={{ marginRight: 6 }} /> Chat
                     </Button>
                     <Button 
                       fullWidth 
                       onClick={() => setActiveTab('notes')} 
                       sx={{ 
                        borderRadius: '6px', 
                        bgcolor: activeTab === 'notes' ? (isDark ? '#3f3f46' : '#ffffff') : 'transparent', 
                        color: activeTab === 'notes' ? textColor : textMuted, 
                        py: 0.75, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, 
                        boxShadow: activeTab === 'notes' ? (isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)') : 'none',
                        transition: 'all 0.2s', '&:hover': { bgcolor: activeTab === 'notes' ? undefined : (isDark ? '#3f3f46' : '#e4e4e7') } 
                      }}
                     >
                       <FileText size={14} style={{ marginRight: 6 }} /> Notes
                     </Button>
                   </Box>

                  {/* Tab Content Area */}
                  <Box sx={{ flex: 1, pt: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: borderColor, borderRadius: 10 }, display: 'flex', flexDirection: 'column' }}>
                       {activeTab === 'chat' ? (
                         <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-in-out' }}>
                           {socket && <StudyRoomChat socket={socket} roomId={id} />}
                         </Box>
                       ) : (
                         <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-in-out' }}>
                           <NotesUploader session={session} setSession={setSession} />
                         </Box>
                       )}
                  </Box>
               </Box>
            </motion.div>
         )}
       </AnimatePresence>
    </Box>
  );
}
