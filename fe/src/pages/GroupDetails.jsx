import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, MessageSquare, Columns, Folder, Video, TerminalSquare, Shield, Crosshair, Radio } from 'lucide-react';
import { Box, Typography, Button, CircularProgress, Grid, Avatar, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SquadKanban from '../components/squad/SquadKanban';
import SquadVault from '../components/squad/SquadVault';
import SquadStudyRoom from '../components/squad/SquadStudyRoom';
import SquadChat from '../components/squad/SquadChat';

const SANS = '"Inter", "Roboto", sans-serif';
const RED = '#ff4655';

export default function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await api.get('/groups');
        const found = res.data.find(g => g._id === id);
        if (found) setGroup(found);
        
        try {
          const peekRes = await api.get(`/groups/${id}/quick-peek`);
          setMembers(peekRes.data.members || []);
        } catch(e) {}
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: isDark ? '#050505' : '#f0f0f0' }}><CircularProgress sx={{ color: RED }} /></Box>;
  if (!group) return <Typography align="center" sx={{ mt: 8, fontFamily: 'monospace', color: RED }}>[ERROR: SQUAD DATA NOT FOUND]</Typography>;

  const tabs = [
    { id: 'chat', label: 'COMMS / AI', icon: MessageSquare },
    { id: 'kanban', label: 'OP BOARD', icon: Columns },
    { id: 'vault', label: 'VAULT', icon: Folder },
    { id: 'room', label: 'WAR ROOM', icon: Video }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#050505' : '#f0f0f0', backgroundImage: isDark ? 'radial-gradient(circle at 10% 20%, rgba(255, 70, 85, 0.03), transparent 40%)' : 'none', pt: 4, pb: 8, fontFamily: SANS }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 3 }}>
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, borderBottom: '1px solid', borderColor: isDark ? '#333' : '#ddd', pb: 2 }}>
          <Button onClick={() => navigate('/groups')} startIcon={<ArrowLeft size={18} />} sx={{ color: isDark ? '#a3a3a3' : '#555', fontFamily: 'monospace', '&:hover': { color: isDark ? '#fff' : '#000', bgcolor: isDark ? '#111' : '#e5e5e5' }, borderRadius: 0, px: 2 }}>
            ABORT
          </Button>
          <Box sx={{ height: 24, width: '1px', bgcolor: isDark ? '#333' : '#ddd' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Crosshair size={28} color={RED} />
            <Box>
              <Typography sx={{ fontFamily: SANS, fontWeight: 900, fontSize: { xs: '1.5rem', md: '2rem' }, color: isDark ? '#fff' : '#000', textTransform: 'uppercase', letterSpacing: -1, lineHeight: 1 }}>
                {group.name}
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', color: RED, fontSize: '0.75rem', letterSpacing: 2 }}>
                SQUAD HUB // SECURE CONNECTION
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Tab Navigation */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, borderBottom: '2px solid', borderColor: isDark ? '#222' : '#ddd', overflowX: 'auto', pb: 0 }}>
              {tabs.map((t) => {
                const active = activeTab === t.id;
                return (
                  <Button 
                    key={t.id}
                    onClick={() => setActiveTab(t.id)} 
                    startIcon={<t.icon size={16} />} 
                    sx={{ 
                      borderRadius: '4px 4px 0 0', px: 3, py: 1.5, 
                      fontFamily: SANS, fontWeight: 900, letterSpacing: 1, 
                      color: active ? (isDark ? '#fff' : '#000') : (isDark ? '#737373' : '#a3a3a3'),
                      bgcolor: active ? (isDark ? '#111' : '#fff') : 'transparent',
                      border: '1px solid',
                      borderColor: active ? (isDark ? '#333' : '#ddd') : 'transparent',
                      borderBottom: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        color: active ? undefined : (isDark ? '#ccc' : '#444'),
                        bgcolor: active ? undefined : (isDark ? '#111' : '#f9f9f9')
                      }
                    }}
                  >
                    {t.label}
                    {/* LED Indicator */}
                    {active && <motion.div layoutId="led" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: RED, boxShadow: `0 0 10px ${RED}` }} />}
                  </Button>
                );
              })}
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, bgcolor: isDark ? '#0a0a0a' : '#fff', border: '1px solid', borderColor: isDark ? '#262626' : '#e5e5e5', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {activeTab === 'chat' && <SquadChat groupId={id} subject={group.subject} name={group.name} />}
                  {activeTab === 'kanban' && <SquadKanban groupId={id} initialTasks={group.kanbanTasks || []} />}
                  {activeTab === 'vault' && <SquadVault groupId={id} initialResources={group.resources || []} />}
                  {activeTab === 'room' && <SquadStudyRoom groupId={id} name={group.name} />}
                </motion.div>
              </AnimatePresence>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            {/* Squad Roster Sidebar */}
            <Box sx={{ 
              p: 3, 
              bgcolor: isDark ? '#0a0a0a' : '#fff', 
              border: '1px solid', borderColor: isDark ? '#262626' : '#e5e5e5',
              borderTop: `4px solid ${RED}`,
              position: 'sticky', top: 24, minHeight: 400
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontFamily: SANS, fontWeight: 900, fontSize: '1rem', color: isDark ? '#fff' : '#000', textTransform: 'uppercase', letterSpacing: 1 }}>Roster</Typography>
                <Typography sx={{ fontFamily: 'monospace', color: RED, fontWeight: 800, fontSize: '0.75rem' }}>{members.length}/{group.maxMembers}</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {members.length > 0 ? members.map(m => {
                  const isLeader = group.createdBy && (group.createdBy === m._id || group.createdBy._id === m._id);
                  return (
                    <Box key={m._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid', borderColor: isDark ? '#1a1a1a' : '#f0f0f0', bgcolor: isDark ? '#111' : '#fafafa', position: 'relative', overflow: 'hidden' }}>
                      {/* Subdued online status bar behind avatar */}
                      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, bgcolor: RED }} />
                      <Box sx={{ position: 'relative' }}>
                        <Avatar src={m.avatar || ''} alt={m.name} sx={{ width: 36, height: 36, border: `1px solid ${isDark ? '#333' : '#ccc'}`, borderRadius: 0 }} />
                        <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, bgcolor: RED, border: `2px solid ${isDark ? '#111' : '#fafafa'}`, borderRadius: '50%' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: isDark ? '#fff' : '#000', lineHeight: 1 }}>{m.name.toUpperCase()}</Typography>
                        {isLeader && <Typography sx={{ fontFamily: 'monospace', color: RED, fontSize: '0.6rem', fontWeight: 900, mt: 0.5 }}>COMMANDER</Typography>}
                      </Box>
                    </Box>
                  );
                }) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, border: '1px dashed', borderColor: isDark ? '#333' : '#ddd', justifyContent: 'center' }}>
                    <Radio size={14} color="#555" className="animate-pulse" />
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: isDark ? '#555' : '#888' }}>SCANNING FREQUENCIES...</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
