import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NotesUploader from '../components/NotesUploader';
import VideoRoom from '../components/VideoRoom';
import SharedWhiteboard from '../components/SharedWhiteboard';
import StudyRoomChat from '../components/StudyRoomChat';
import CollabNotes from '../components/CollabNotes';
import GroupPomodoro from '../components/studyroom/GroupPomodoro';
import RaiseHand from '../components/studyroom/RaiseHand';
import LivePoll from '../components/studyroom/LivePoll';
import AmbientMusic from '../components/studyroom/AmbientMusic';
import RoomLeaderboard from '../components/studyroom/RoomLeaderboard';
import TaskBoard from '../components/studyroom/TaskBoard';
import VoiceReactions from '../components/studyroom/VoiceReactions';
import SessionReport from '../components/studyroom/SessionReport';
import {
  ArrowLeft, Users, Loader2, Maximize, MessageSquare,
  FileText, PenLine, LayoutList, LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Box, Typography, IconButton, Button, Tooltip, useTheme } from '@mui/material';
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
  const [showReport, setShowReport] = useState(false);
  const whiteboardRef = useRef(null);

  useEffect(() => {
    const fetchSessionAndJoin = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        const found = res.data;
        if (!found) { toast.error('Session not found'); return navigate('/sessions'); }

        const isParticipant = found.participants?.some(p => p._id === user?._id || p === user?._id);
        const isHost = found.host?._id === user?._id || found.host === user?._id;

        if (!isParticipant && !isHost) {
          try {
            await api.post(`/sessions/${id}/join`);
            toast.success('Automatically joined the session via direct link!');
            const joinedRes = await api.get(`/sessions/${id}`);
            setSession(joinedRes.data);
          } catch (joinErr) {
            toast.error(joinErr.response?.data?.message || 'Session is full or unavailable.');
            return navigate('/sessions');
          }
        } else {
          setSession(found);
        }
      } catch (err) {
        console.error('StudyRoom Load Error:', err);
        toast.error(err.response?.data?.message || err.message || 'Failed to load study room');
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchSessionAndJoin();
  }, [id, navigate, user]);

  useEffect(() => {
    if (!session) return;
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    const newSocket = io(wsUrl, { withCredentials: true });
    newSocket.emit('join_study_room', {
      roomId: id, userId: user?._id, userName: user?.name,
      title: session.title, subject: session.subject,
    });
    setSocket(newSocket);
    return () => {
      newSocket.emit('leave_study_room', { roomId: id });
      newSocket.disconnect();
    };
  }, [id, session, user]);

  // Poll vote relay
  useEffect(() => {
    if (!socket) return;
    socket.on('poll:vote', ({ roomId, optionIndex, userId }) => {
      socket.emit('poll:update', { roomId, optionIndex, userId });
    });
    socket.on('task:add', ({ roomId, task }) => socket.emit('task:add', task));
    socket.on('task:move', ({ roomId, id, col }) => socket.emit('task:move', { id, col }));
    socket.on('task:remove', ({ roomId, id }) => socket.emit('task:remove', { id }));
  }, [socket]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && whiteboardRef.current) {
      whiteboardRef.current.requestFullscreen().catch(err => toast.error(`Fullscreen error: ${err.message}`));
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const leaveRoom = () => { setShowReport(true); };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: isDark ? '#0f0f11' : '#f8f9fa' }}>
        <Loader2 className="animate-spin text-blue-500" size={40} color={isDark ? '#fff' : '#000'} />
      </Box>
    );
  }
  if (!session) return null;

  const surfaceColor = isDark ? '#1e1e1e' : '#ffffff';
  const borderColor = isDark ? '#333333' : '#e0e0e0';
  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const textMuted = isDark ? '#a1a1aa' : '#71717a';

  const TABS = [
    { key: 'chat',     icon: <MessageSquare size={10} />, label: 'Chat' },
    { key: 'notes',    icon: <FileText size={10} />,      label: 'Files' },
    { key: 'collab',   icon: <PenLine size={10} />,       label: 'Notes' },
    { key: 'tools',    icon: <LayoutList size={10} />,    label: 'Tools' },
  ];

  const sharedProps = { socket, roomId: id, session, isDark };

  return (
    <Box sx={{
      display: 'flex', height: '100vh',
      bgcolor: isDark ? '#121212' : '#f0f2f5',
      backgroundImage: `radial-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      color: textColor, overflow: 'hidden', fontFamily: 'Inter, sans-serif', position: 'relative'
    }}>

      {/* Voice reactions overlay (always mounted if in room) */}
      {socket && <VoiceReactions socket={socket} roomId={id} />}

      {/* Session Report modal */}
      {showReport && (
        <SessionReport {...sharedProps} onClose={() => { setShowReport(false); navigate('/sessions'); }} />
      )}

      {/* Main Canvas Area */}
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Nav Overlay */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <Box sx={{
            pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2.5 },
            bgcolor: surfaceColor, px: 1, py: 1, borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
              <IconButton size="small" onClick={() => navigate('/sessions')}
                sx={{ color: textMuted, borderRadius: 1, '&:hover': { bgcolor: isDark ? '#2c2c2c' : '#f4f4f5', color: textColor }, transition: 'all 0.2s' }}>
                <ArrowLeft size={16} />
              </IconButton>
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: textColor, display: { xs: 'none', sm: 'block' } }}>
                {session.title}
              </Typography>
            </Box>

            <Box sx={{ width: 1, height: 16, bgcolor: borderColor }} />

            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '4px', bgcolor: isDark ? '#27272a' : '#f4f4f5', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{session.subject}</Typography>
            </Box>

            <Box sx={{ width: 1, height: 16, bgcolor: borderColor }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.75, color: textMuted }}>
                <Users size={14} color={textMuted} />
                <Box component="span">{session.participants?.length || 1} <Box component="span" sx={{ opacity: 0.4 }}>/</Box> {session.maxParticipants || '∞'}</Box>
              </Typography>
              <Tooltip title="Fullscreen Whiteboard">
                <IconButton size="small" onClick={toggleFullscreen} sx={{ color: textMuted, borderRadius: 1, '&:hover': { bgcolor: isDark ? '#2c2c2c' : '#f4f4f5', color: textColor }, transition: 'all 0.2s', ml: 0.5 }}>
                  <Maximize size={14} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Leave & See Stats">
                <IconButton size="small" onClick={leaveRoom} sx={{ color: '#ef4444', borderRadius: 1, '&:hover': { bgcolor: '#ef444422' }, transition: 'all 0.2s' }}>
                  <LogOut size={14} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Whiteboard */}
        <Box ref={whiteboardRef} sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: 'transparent' }}>
          {socket && <SharedWhiteboard roomId={id} socket={socket} />}
        </Box>

        {/* Video Dock */}
        <Box sx={{ position: 'absolute', bottom: 80, left: 32, zIndex: 50, pointerEvents: 'none', width: 'auto', maxWidth: 1200 }}>
          {socket && <VideoRoom roomId={id} socket={socket} onTogglePanel={() => setShowPanel(!showPanel)} showPanel={showPanel} />}
        </Box>
      </Box>

      {/* Side Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'absolute', right: 24, top: 80, bottom: 80, width: 340,
              borderRadius: '12px', background: surfaceColor,
              border: `1px solid ${borderColor}`,
              boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column', zIndex: 60, overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'hidden' }}>

              {/* Tabs Nav */}
              <Box sx={{ display: 'flex', p: 0.5, bgcolor: isDark ? '#27272a' : '#f4f4f5', borderRadius: '8px', border: `1px solid ${borderColor}`, gap: 0.25, flexShrink: 0 }}>
                {TABS.map(tab => (
                  <Button key={tab.key} fullWidth onClick={() => setActiveTab(tab.key)}
                    sx={{
                      borderRadius: '6px', minWidth: 0,
                      bgcolor: activeTab === tab.key ? (isDark ? '#3f3f46' : '#ffffff') : 'transparent',
                      color: activeTab === tab.key ? textColor : textMuted,
                      py: 0.6, fontWeight: 600, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: 0.5,
                      boxShadow: activeTab === tab.key ? (isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)') : 'none',
                      transition: 'all 0.2s', '&:hover': { bgcolor: activeTab === tab.key ? undefined : (isDark ? '#3f3f46' : '#e4e4e7') },
                      display: 'flex', gap: 0.5, alignItems: 'center',
                    }}
                  >
                    {tab.icon}{tab.label}
                  </Button>
                ))}
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: borderColor, borderRadius: 10 }, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                {activeTab === 'chat' && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Compact tools above chat */}
                    <GroupPomodoro {...sharedProps} />
                    <RaiseHand {...sharedProps} />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {socket && <StudyRoomChat socket={socket} roomId={id} />}
                    </Box>
                  </Box>
                )}

                {activeTab === 'notes' && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <NotesUploader session={session} setSession={setSession} />
                  </Box>
                )}

                {activeTab === 'collab' && (
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {socket && <CollabNotes roomId={id} sessionId={id} socket={socket} />}
                  </Box>
                )}

                {activeTab === 'tools' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <LivePoll {...sharedProps} />
                    <AmbientMusic isDark={isDark} />
                    <RoomLeaderboard socket={socket} roomId={id} isDark={isDark} />
                    <TaskBoard socket={socket} roomId={id} isDark={isDark} />
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
