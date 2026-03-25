import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Users, Calendar, BookOpen, MessageCircle, TrendingUp, UserPlus, RefreshCw, Clock, Check, X, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import GamificationDashboard from '../components/GamificationDashboard';
import UserQuickPeek from '../components/UserQuickPeek';
import GlobalActivityFeed from '../components/dashboard/GlobalActivityFeed';
import BountiesWidget from '../components/dashboard/BountiesWidget';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Box, Container, Typography, Grid, Button, Avatar, Chip, IconButton, useTheme } from '@mui/material';

// --- Shared Premium Components ---
function TiltCard({ children, sx }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0); y.set(0);
  };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000, display: 'flex', height: '100%' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
    >
      <Box sx={{ 
        width: '100%', 
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)', 
        backdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', 
        borderRadius: '24px',
        boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.2)' : '0 10px 30px rgba(0, 0, 0, 0.05)', 
        overflow: 'hidden', ...sx 
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const fadeUpSpring = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function Dashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const [stats, setStats] = useState({ connections: 0, sessions: 0, pending: 0 });
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    welcomeTitle: "Welcome back, {name}!",
    welcomeSubtitle: "Find your perfect study buddy and achieve your goals together.",
    showQuickActions: true,
    showSuggestedMatches: true,
    showStatCards: true,
    showProfileIncompleteBanner: true
  });

  useEffect(() => {
    if (user?.isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [connRes, sessRes, matchRes, setRes] = await Promise.all([
          api.get('/users/connections'),
          api.get('/sessions/my'),
          api.get('/users/matches'),
          api.get('/settings').catch(() => ({ data: settings }))
        ]);
        setStats({
          connections: connRes.data.connections.length,
          sessions: sessRes.data.length,
          pending: connRes.data.pendingRequests.length
        });
        setRecentMatches(matchRes.data.slice(0, 3));
        const now = new Date().getTime();
        setUpcomingSessions(sessRes.data.filter(s => {
          const sessionEnd = new Date(s.startTime).getTime() + (s.duration * 60000);
          return sessionEnd > now;
        }).slice(0, 3));
        setPendingRequests(connRes.data.pendingRequests.slice(0, 3));
        if (setRes.data && Object.keys(setRes.data).length > 0) setSettings(setRes.data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, refreshKey]);

  const navigate = useNavigate();

  const handleAccept = async (userId) => {
    try {
      await api.post(`/users/accept/${userId}`);
      toast.success('Connection accepted!');
      setRefreshKey(prev => prev + 1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/users/reject/${userId}`);
      toast.success('Request rejected');
      setRefreshKey(prev => prev + 1);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statCards = [
    { label: 'Connections', value: stats.connections, icon: Users, color: '#6366f1', link: '/connections' },
    { label: 'My Sessions', value: stats.sessions, icon: Calendar, color: '#10b981', link: '/sessions' },
    { label: 'Pending Requests', value: stats.pending, icon: UserPlus, color: '#f59e0b', link: '/connections' },
  ];

  if (loading) {
    return (
      <Box sx={{ bgcolor: isDark ? '#020617' : '#f8f9fa', minHeight: '100vh', py: 4 }} />
    );
  }

  return (
    <Box sx={{ bgcolor: isDark ? '#020617' : '#f8f9fa', minHeight: '100vh', color: isDark ? 'white' : '#0f172a' }}>
      <style>
        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
      </style>

      <Container component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* ================= LEFT MAIN COLUMN ================= */}
          <Grid item xs={12} lg={8}>
            
            {/* Hero Section */}
            <Box component={motion.div} variants={fadeUpSpring} sx={{ mb: 4 }}>
              <TiltCard sx={{ 
                background: isDark ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.05) 100%)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
                border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.1)', p: { xs: 4, sm: 5 }
              }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 3 }}>
                  <Box>
                    <Typography variant="h3" component="h1" fontWeight={900} color={isDark ? "white" : "#0f172a"} gutterBottom sx={{ letterSpacing: '-1px' }}>
                      {settings.welcomeTitle.replace('{name}', user?.name?.split(' ')[0] || '')} 👋
                    </Typography>
                    <Typography variant="h6" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} fontWeight={500} maxWidth={600}>
                      {settings.welcomeSubtitle}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined" onClick={() => { setRefreshKey(prev => prev + 1); toast.success('Dashboard Resynced!'); }} disabled={loading}
                    startIcon={<RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />}
                    sx={{
                      color: isDark ? 'white' : '#6366f1', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.3)', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                      backdropFilter: 'blur(10px)', fontWeight: 800, px: 3, py: 1.5, borderRadius: '100px', textTransform: 'none',
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.1)' }
                    }}
                  >
                    Sync Live
                  </Button>
                </Box>
              </TiltCard>
            </Box>

            {/* Alert Banner */}
            {(settings.showProfileIncompleteBanner !== false) && user?.subjects?.length === 0 && (
              <Box component={motion.div} variants={fadeUpSpring} sx={{ mb: 4 }}>
                <Box sx={{ 
                  bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)', 
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(245, 158, 11, 0.2)', 
                  borderRadius: '24px', p: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)', p: 1.5, borderRadius: 3 }}><TrendingUp color="#f59e0b" size={24} /></Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color={isDark ? "#fbbf24" : "#d97706"}>System Offline: Profile Incomplete</Typography>
                      <Typography variant="body2" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"}>Inject your subjects and metadata to activate the Recommendation Engine!</Typography>
                    </Box>
                  </Box>
                  <Button component={RouterLink} to="/profile/edit" variant="contained" sx={{ bgcolor: '#f59e0b', color: isDark ? '#020617' : 'white', fontWeight: 800, borderRadius: '100px', '&:hover': { bgcolor: '#d97706' } }}>
                    Initialize Profile
                  </Button>
                </Box>
              </Box>
            )}

            {/* Quick Operations Matrix */}
            {settings.showQuickActions && (
              <Box component={motion.div} variants={fadeUpSpring} sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                  {[
                    { to: '/browse', icon: Users, label: 'Browse Matrix', color: '#6366f1' },
                    { to: '/sessions', icon: Calendar, label: 'Study Sessions', color: '#10b981' },
                    { to: '/messages', icon: MessageCircle, label: 'Comms Link', color: '#c084fc' },
                    { to: '/profile/edit', icon: BookOpen, label: 'System Loadout', color: '#f59e0b' },
                  ].map(({ to, icon: Icon, label, color }) => (
                    <Grid item xs={6} sm={3} key={to}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ height: '100%' }}>
                        <Button component={RouterLink} to={to} variant="outlined" fullWidth sx={{
                          p: 3, display: 'flex', flexDirection: 'column', gap: 1.5, borderRadius: '20px', 
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
                          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
                          color: isDark ? 'white' : '#0f172a', textTransform: 'none',
                          '&:hover': { borderColor: color, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }
                        }}>
                          <Icon size={32} color={color} />
                          <Typography variant="body2" fontWeight={800}>{label}</Typography>
                        </Button>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Gamification Dashboard */}
            <Box component={motion.div} variants={fadeUpSpring} sx={{ mb: 4 }}>
              <Box sx={{ 
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', 
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', 
                borderRadius: '24px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.05)'
              }}>
                <GamificationDashboard />
              </Box>
            </Box>

            {/* Upcoming Sessions */}
            <Box component={motion.div} variants={fadeUpSpring}>
              <TiltCard sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h5" fontWeight={900} color={isDark ? "white" : "#0f172a"} display="flex" alignItems="center" gap={1.5}>
                    <Clock size={24} color="#10b981" /> Next Sessions
                  </Typography>
                  <Button component={RouterLink} to="/sessions" size="small" variant="text" sx={{ color: '#818cf8', fontWeight: 800 }}>Agenda</Button>
                </Box>

                {upcomingSessions.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 5, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                    <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', p: 3, borderRadius: '50%', mb: 2 }}>
                      <Calendar size={32} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                    </Box>
                    <Typography variant="body1" fontWeight={600}>No upcoming sessions.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {upcomingSessions.map(session => {
                      const isOngoing = new Date(session.startTime).getTime() <= new Date().getTime();
                      return (
                      <Grid item xs={12} sm={6} key={session._id}>
                        <motion.div layoutId={`session-${session._id}`} layout whileHover={{ y: -5 }}>
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2.5,
                            borderRadius: '20px', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f8f9fa', 
                            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                            transition: 'border-color 0.2s', '&:hover': { borderColor: '#10b981' }
                          }}>
                            <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', px: 2, py: 1.5, borderRadius: '16px', textAlign: 'center', minWidth: 60 }}>
                              <Typography variant="caption" fontWeight={900} display="block" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                {new Date(session.startTime).toLocaleDateString('en-US', { month: 'short' })}
                              </Typography>
                              <Typography variant="h5" fontWeight={900} display="block" sx={{ lineHeight: 1, mt: 0.5 }}>
                                {new Date(session.startTime).getDate()}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body1" fontWeight={800} color={isDark ? "white" : "#0f172a"} noWrap>{session.title}</Typography>
                              <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontWeight={700} sx={{ mt: 0.5, display: 'block' }}>{session.subject}</Typography>
                            </Box>
                            <Button component={RouterLink} to={`/study-room/${session._id}`} variant={isOngoing ? "contained" : "outlined"} 
                              sx={{ 
                                borderRadius: '100px', fontWeight: 800, textTransform: 'none',
                                bgcolor: isOngoing ? '#ef4444' : 'transparent', color: isOngoing ? 'white' : '#10b981',
                                borderColor: isOngoing ? 'transparent' : 'rgba(16, 185, 129, 0.3)',
                                '&:hover': { bgcolor: isOngoing ? '#dc2626' : 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }
                              }}>
                              {isOngoing ? 'Enter Live' : 'Join'}
                            </Button>
                          </Box>
                        </motion.div>
                      </Grid>
                    )})}
                  </Grid>
                )}
              </TiltCard>
            </Box>

          </Grid>

          {/* ================= RIGHT SIDEBAR COLUMN ================= */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              
              {/* Stats Cards */}
              {settings.showStatCards && (
                <Box component={motion.div} variants={fadeUpSpring}>
                  <Grid container spacing={2}>
                    {statCards.map(({ label, value, icon: Icon, color, link }) => (
                      <Grid item xs={12} sm={4} lg={12} key={label}>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Box component={RouterLink} to={link} sx={{
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2.5, p: 2.5,
                            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', 
                            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                            borderRadius: '24px', transition: 'border-color 0.2s', '&:hover': { borderColor: color },
                            boxShadow: isDark ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.05)'
                          }}>
                            <Box sx={{ bgcolor: `${color}20`, p: 2, borderRadius: '16px', color: color, display: 'flex' }}>
                              <Icon size={28} />
                            </Box>
                            <Box>
                              <Typography variant="h4" fontWeight={900} color={isDark ? "white" : "#0f172a"} lineHeight={1}>{value}</Typography>
                              <Typography variant="caption" fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} textTransform="uppercase" letterSpacing={1}>{label}</Typography>
                            </Box>
                          </Box>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Global Activity Feed */}
              <Box component={motion.div} variants={fadeUpSpring}>
                <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', borderRadius: '24px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
                  <GlobalActivityFeed />
                </Box>
              </Box>

              {/* Suggested Matches */}
              {settings.showSuggestedMatches && (
                <Box component={motion.div} variants={fadeUpSpring}>
                  <TiltCard sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0f172a"} display="flex" alignItems="center" gap={1.5}>
                        <TrendingUp size={20} color="#6366f1" /> Suggestions
                      </Typography>
                      <Button component={RouterLink} to="/matches" size="small" variant="text" sx={{ color: '#818cf8', fontWeight: 800 }}>Expand</Button>
                    </Box>
                    
                    {recentMatches.length === 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                        <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', p: 3, borderRadius: '50%', mb: 2 }}>
                          <Users size={24} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                        </Box>
                        <Typography variant="caption" fontWeight={700}>Matrix requires more data.</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {recentMatches.map(match => (
                          <motion.div layoutId={`match-${match._id}`} layout key={match._id} whileHover={{ x: 5 }}>
                            <Box sx={{
                              display: 'flex', alignItems: 'center', gap: 2, p: 2,
                              borderRadius: '20px', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f8f9fa', border: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.05)',
                              '&:hover': { borderColor: '#6366f1', bgcolor: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.05)' }
                            }}>
                              <UserQuickPeek userId={match._id}>
                                <Avatar src={match.avatar} sx={{ width: 44, height: 44, bgcolor: '#4f46e5', fontWeight: 900 }}>
                                  {match?.name?.[0] || 'U'}
                                </Avatar>
                              </UserQuickPeek>
                              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                <Typography variant="body2" fontWeight={800} color={isDark ? "white" : "#0f172a"} noWrap>{match.name}</Typography>
                                <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} fontWeight={600} noWrap>
                                  {match.subjects?.slice(0, 2).join(', ')}
                                </Typography>
                              </Box>
                              <Button component={RouterLink} to={`/user/${match._id}`} variant="outlined" size="small" 
                                sx={{ borderRadius: '100px', fontWeight: 800, minWidth: 0, px: 2, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', color: isDark ? 'white' : '#6366f1' }}>
                                Trgt
                              </Button>
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                    )}
                  </TiltCard>
                </Box>
              )}

              {/* Pending Requests */}
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0f172a"} display="flex" alignItems="center" gap={1.5}>
                      <UserPlus size={20} color="#f59e0b" /> Comm Links
                    </Typography>
                    <Button component={RouterLink} to="/connections" size="small" variant="text" sx={{ color: '#fbbf24', fontWeight: 800 }}>Review</Button>
                  </Box>
                  
                  {pendingRequests.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                      <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', p: 3, borderRadius: '50%', mb: 2 }}>
                        <Check size={24} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                      </Box>
                      <Typography variant="caption" fontWeight={700}>All requests cleared!</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {pendingRequests.map(req => (
                        <motion.div key={req._id} whileHover={{ x: 5 }}>
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2,
                            borderRadius: '20px', bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f8f9fa', border: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.05)'
                          }}>
                            <UserQuickPeek userId={req._id}>
                              <Avatar src={req.avatar} sx={{ width: 44, height: 44, bgcolor: '#b45309', color: 'white', fontWeight: 900 }}>
                                {req.name?.[0]}
                              </Avatar>
                            </UserQuickPeek>
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                              <Typography variant="body2" fontWeight={800} color={isDark ? "white" : "#0f172a"} noWrap>{req.name}</Typography>
                              <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontWeight={600} noWrap>Sync request</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <IconButton onClick={() => handleAccept(req._id)} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', '&:hover': { bgcolor: '#10b981', color: 'white' } }}>
                                  <Check size={18} />
                                </IconButton>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <IconButton onClick={() => handleReject(req._id)} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}>
                                  <X size={18} />
                                </IconButton>
                              </motion.div>
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                    </Box>
                  )}
                </TiltCard>
              </Box>

              {/* Bounties Widget */}
              <Box component={motion.div} variants={fadeUpSpring}>
                <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'white', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', borderRadius: '24px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.05)' }}>
                  <BountiesWidget />
                </Box>
              </Box>

            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}