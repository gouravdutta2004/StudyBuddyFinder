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
import { Box, Typography, IconButton, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

export default function StudyRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [socket, setSocket] = useState(null);
  const whiteboardRef = useRef(null);

  useEffect(() => {
    const fetchSessionAndJoin = async () => {
      try {
        // Fetch the global session via the new dedicated endpoint
        const res = await api.get(`/sessions/${id}`);
        const found = res.data;
        
        if (!found) {
          toast.error("Session not found");
          return navigate('/sessions');
        }

        // Check if user is already a participant
        const isParticipant = found.participants?.some(p => p._id === user?._id || p === user?._id);
        const isHost = found.host?._id === user?._id || found.host === user?._id;

        if (!isParticipant && !isHost) {
          // Attempt Auto-Join sequence for direct link sharers
          try {
            await api.post(`/sessions/${id}/join`);
            toast.success("Automatically joined the session via direct link!");
            // Re-fetch populated session
            const joinedRes = await api.get(`/sessions/${id}`);
            setSession(joinedRes.data);
          } catch (joinErr) {
            toast.error(joinErr.response?.data?.message || "Session is full or unavailable.");
            return navigate('/sessions');
          }
        } else {
          // Already a participant
          setSession(found);
        }

      } catch (err) {
        toast.error('Failed to load study room or verify permissions');
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
    const newSocket = io('http://localhost:5001', { withCredentials: true });
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0f1115' }}>
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </Box>
    );
  }
  if (!session) return null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0f111a', color: 'white', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
       {/* Main Canvas Area */}
       <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
           {/* Top Nav Overlay */}
           <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
               <Box sx={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(20,20,30,0.6)', backdropFilter: 'blur(16px)', px: 3, py: 1.5, borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                   <IconButton onClick={() => navigate('/sessions')} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}><ArrowLeft size={18} /></IconButton>
                   <Typography variant="subtitle1" fontWeight={700} sx={{ letterSpacing: 0.5 }}>{session.title}</Typography>
                   <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />
                   <Typography variant="body2" color="rgba(255,255,255,0.7)" fontWeight={500}>{session.subject}</Typography>
               </Box>
               
               <Box sx={{ pointerEvents: 'auto', background: 'rgba(20,20,30,0.6)', backdropFilter: 'blur(16px)', px: 2.5, py: 1.5, borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 2 }}>
                   <Typography variant="body2" fontWeight={600} display="flex" alignItems="center" gap={1}>
                      <Users size={16} color="#60a5fa" /> 
                      {session.participants?.length || 1} / {session.maxParticipants || '∞'}
                   </Typography>
                   <Box sx={{ width: '1px', height: 16, bgcolor: 'rgba(255,255,255,0.2)' }} />
                   <IconButton size="small" onClick={toggleFullscreen} sx={{ color: 'white', '&:hover': { color: '#60a5fa' } }} title="Fullscreen Whiteboard">
                     <Maximize size={16} />
                   </IconButton>
               </Box>
           </Box>

           {/* Whiteboard occupying the entire background */}
           <Box ref={whiteboardRef} sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: '#0f111a' }}>
             {socket && <SharedWhiteboard roomId={id} socket={socket} />}
           </Box>

           {/* Floating Video Dock on the left bottom */}
           <Box sx={{ position: 'absolute', bottom: 32, left: 32, zIndex: 50, pointerEvents: 'none', width: 'auto', maxWidth: 1200 }}>
              {socket && <VideoRoom roomId={id} socket={socket} onTogglePanel={() => setShowPanel(!showPanel)} showPanel={showPanel} />}
           </Box>
       </Box>

       {/* Collapsible Side Panel */}
       <AnimatePresence>
         {showPanel && (
            <motion.div
               initial={{ width: 0, opacity: 0 }}
               animate={{ width: 400, opacity: 1 }}
               exit={{ width: 0, opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: '#13151a', display: 'flex', flexDirection: 'column', zIndex: 60 }}
            >
               <Box sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'hidden' }}>
                   {/* Tabs Nav */}
                   <Box sx={{ display: 'flex', bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 3, p: 0.5 }}>
                     <Button 
                       fullWidth 
                       onClick={() => setActiveTab('chat')} 
                       sx={{ borderRadius: 2.5, bgcolor: activeTab === 'chat' ? 'rgba(59,130,246,0.2)' : 'transparent', color: activeTab === 'chat' ? '#60a5fa' : 'rgba(255,255,255,0.5)', py: 1, fontWeight: 700, textTransform: 'none', transition: 'all 0.2s', '&:hover': { bgcolor: activeTab === 'chat' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)' } }}
                     >
                       <MessageSquare size={16} style={{ marginRight: 8 }} /> Chat
                     </Button>
                     <Button 
                       fullWidth 
                       onClick={() => setActiveTab('notes')} 
                       sx={{ borderRadius: 2.5, bgcolor: activeTab === 'notes' ? 'rgba(59,130,246,0.2)' : 'transparent', color: activeTab === 'notes' ? '#60a5fa' : 'rgba(255,255,255,0.5)', py: 1, fontWeight: 700, textTransform: 'none', transition: 'all 0.2s', '&:hover': { bgcolor: activeTab === 'notes' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)' } }}
                     >
                       <FileText size={16} style={{ marginRight: 8 }} /> Notes
                     </Button>
                  </Box>

                  {/* Tab Content Area */}
                  <Box sx={{ flex: 1, pt: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 10 }, display: 'flex', flexDirection: 'column' }}>
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
