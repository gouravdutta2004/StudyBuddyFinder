import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, Grid, IconButton, useTheme, Tabs, Tab } from '@mui/material';
import { Check, X, ShieldCheck, Users, Clock, School, UserPlus, Ban, Trash2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// --- Premium Shared Component ---
function TiltCard({ children, sx }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const xPct = (e.clientX - rect.left) / width - 0.5;
    const yPct = (e.clientY - rect.top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

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

const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUpSpring = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function OrgAdminDashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [orgStats, setOrgStats] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, usersRes, statsRes] = await Promise.all([
        api.get('/admin/pending-users'),
        api.get('/admin/org-users'),
        api.get('/admin/org-stats')
      ]);
      setPendingUsers(pendingRes.data);
      setOrgUsers(usersRes.data);
      setOrgStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to fetch institution matrices');
    }
  };

  const handleAction = async (id, action) => {
    setLoadingId(id);
    try {
      if (action === 'approve') {
        await api.put(`/admin/users/${id}/approve`);
        toast.success('User approved successfully!');
      } else {
        await api.put(`/admin/users/${id}/reject`);
        toast.success('User application rejected.');
      }
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleStatus = async (id) => {
    setLoadingId(id);
    try {
      await api.put(`/admin/org-users/${id}/toggle`);
      toast.success('Student status updated securely');
      fetchData();
    } catch (err) { toast.error('Failed to modify user state'); }
    finally { setLoadingId(null); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to expel this student from your institution network?')) return;
    setLoadingId(id);
    try {
      await api.delete(`/admin/org-users/${id}`);
      toast.success('Entity expelled permanently.');
      fetchData();
    } catch (err) { toast.error('Failed to expel student'); }
    finally { setLoadingId(null); }
  };

  const handleLogout = () => {
    logout();
    toast.success('Securely logged out of Institution Portal');
    window.location.href = '/org-admin-login';
  };

  const statCards = [
    { label: 'Active Students', value: orgStats?.activeStudents || 0, icon: Users, color: '#3b82f6' },
    { label: 'Pending Approvals', value: orgStats?.pendingRequests || 0, icon: UserPlus, color: '#f59e0b' },
    { label: 'Suspended Entities', value: orgStats?.suspendedStudents || 0, icon: ShieldCheck, color: '#ef4444' }
  ];

  return (
    <Box sx={{ bgcolor: isDark ? '#020617' : '#f8f9fa', minHeight: '100vh', color: isDark ? 'white' : '#0f172a', position: 'relative', overflow: 'hidden' }}>
      {/* Background Ambience */}
      <Box sx={{ position: 'fixed', top: '-10%', left: '-5%', width: 500, height: 500, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 500, height: 500, bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* Top Navigation Bar */}
      <Box sx={{ position: 'relative', zIndex: 10, bgcolor: isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', py: 2, px: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
              <School color="#818cf8" size={24} />
            </Box>
            <Typography variant="h6" fontWeight={900} color={isDark ? "white" : "#0f172a"}>
               StudyFriend <Typography component="span" fontWeight={400} sx={{ opacity: 0.6 }}>| Institution Command</Typography>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {user?.isAdmin && (
              <Button onClick={() => window.location.href = '/admin'} variant="outlined" sx={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)', borderRadius: '100px', fontWeight: 800, textTransform: 'none' }}>
                Return to Matrix
              </Button>
            )}
            <Button onClick={handleLogout} variant="contained" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '100px', fontWeight: 800, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}>
              Logout
            </Button>
          </Box>
        </Box>
      </Box>

      <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible" sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          
          {/* TAB HEADERS */}
          <Grid item xs={12}>
            <Tabs 
              value={currentTab} 
              onChange={(e, v) => setCurrentTab(v)}
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#818cf8', height: 4, borderRadius: '4px 4px 0 0' },
                '& .MuiTab-root': { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontWeight: 800, textTransform: 'none', fontSize: '1rem', '&.Mui-selected': { color: '#818cf8' } }
              }}
            >
              <Tab label="Institution Overview" />
              <Tab label="Pending Admissions" />
              <Tab label="Student Roster" />
            </Tabs>
          </Grid>

          {/* TAB 0: OVERVIEW */}
          {currentTab === 0 && (
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {statCards.map((stat, i) => (
                  <Grid item xs={12} sm={4} key={i}>
                    <Box component={motion.div} variants={fadeUpSpring}>
                      <TiltCard sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 64, height: 64, borderRadius: '20px' }}>
                            <stat.icon size={32} />
                          </Avatar>
                          <Box>
                            <Typography variant="h3" fontWeight={900} color={isDark ? "white" : "#0f172a"}>{stat.value}</Typography>
                            <Typography variant="caption" fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} textTransform="uppercase" letterSpacing={1}>{stat.label}</Typography>
                          </Box>
                        </Box>
                      </TiltCard>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          )}

          {/* TAB 1: PENDING ADMISSIONS */}
          {currentTab === 1 && (
            <Grid item xs={12}>
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 0, overflow: 'hidden' }}>
                  <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
                    <Clock size={24} color="#f59e0b" />
                    <Typography variant="h5" fontWeight={900} color={isDark ? "white" : "#0f172a"}>Pending Applications</Typography>
                  </Box>

                  {pendingUsers.length === 0 ? (
                    <Box sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                      <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', p: 3, borderRadius: '50%', mb: 3 }}>
                        <Check size={48} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} color={isDark ? "white" : "#0f172a"} mb={1}>Queue is empty</Typography>
                      <Typography variant="body1" fontWeight={500}>All quiet here. Your organization network is fully up to date.</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table sx={{ '& .MuiTableCell-root': { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                            <TableCell><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Applicant</Typography></TableCell>
                            <TableCell><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Email Identity</Typography></TableCell>
                            <TableCell><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Date Applied</Typography></TableCell>
                            <TableCell align="right"><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Validation</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <AnimatePresence>
                            {pendingUsers.map((u) => (
                              <TableRow component={motion.tr} key={u._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} hover sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                                <TableCell>
                                  <Typography variant="subtitle2" fontWeight={700} color={isDark ? "white" : "#0f172a"}>{u.name}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={u.email} size="small" variant="outlined" sx={{ fontWeight: 600, bgcolor: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color={isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"} fontWeight={600}>
                                    {new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      disabled={loadingId === u._id}
                                      onClick={() => handleAction(u._id, 'approve')}
                                      startIcon={<Check size={16} />}
                                      sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 800, borderRadius: '100px', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', boxShadow: 'none' }}
                                    >
                                      Authorize
                                    </Button>
                                    <IconButton
                                      size="small"
                                      disabled={loadingId === u._id}
                                      onClick={() => handleAction(u._id, 'reject')}
                                      sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}
                                    >
                                      <X size={18} />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TiltCard>
              </Box>
            </Grid>
          )}

          {/* TAB 2: STUDENT ROSTER */}
          {currentTab === 2 && (
            <Grid item xs={12}>
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 0, overflow: 'hidden' }}>
                  <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
                    <Users size={24} color="#6366f1" />
                    <Typography variant="h5" fontWeight={900} color={isDark ? "white" : "#0f172a"}>Active Student Roster</Typography>
                  </Box>

                  {orgUsers.length === 0 ? (
                    <Box sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                      <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', p: 3, borderRadius: '50%', mb: 3 }}>
                        <Users size={48} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} color={isDark ? "white" : "#0f172a"} mb={1}>No active students</Typography>
                      <Typography variant="body1" fontWeight={500}>There are currently no authorized members in your university network.</Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table sx={{ '& .MuiTableCell-root': { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                            <TableCell><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Student Profile</Typography></TableCell>
                            <TableCell><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Status Matrix</Typography></TableCell>
                            <TableCell><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>University Network</Typography></TableCell>
                            <TableCell align="right"><Typography fontWeight={800} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>Override Access</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <AnimatePresence>
                            {orgUsers.map((u) => (
                              <TableRow component={motion.tr} key={u._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }} hover sx={{ '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={u.avatar} sx={{ width: 40, height: 40, bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{u.name.charAt(0)}</Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={700} color={isDark ? "white" : "#0f172a"}>{u.name}</Typography>
                                      <Typography variant="caption" color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}>{u.email}</Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  {u.isActive ? (
                                    <Chip label="Active Node" size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }} />
                                  ) : (
                                    <Chip label="Suspended" size="small" sx={{ fontWeight: 800, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip label={u.organization?.name || 'Local'} size="small" variant="outlined" sx={{ fontWeight: 600, bgcolor: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }} />
                                </TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      disabled={loadingId === u._id}
                                      onClick={() => handleToggleStatus(u._id)}
                                      startIcon={<Ban size={16} />}
                                      sx={{ 
                                        color: u.isActive ? '#f59e0b' : '#10b981', 
                                        borderColor: u.isActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)', 
                                        fontWeight: 800, borderRadius: '100px', textTransform: 'none',
                                        '&:hover': { bgcolor: u.isActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)' }
                                      }}
                                    >
                                      {u.isActive ? 'Suspend' : 'Reinstate'}
                                    </Button>
                                    <IconButton
                                      size="small"
                                      disabled={loadingId === u._id}
                                      onClick={() => handleDeleteUser(u._id)}
                                      sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', '&:hover': { bgcolor: '#ef4444', color: 'white' } }}
                                    >
                                      <Trash2 size={18} />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TiltCard>
              </Box>
            </Grid>
          )}

        </Grid>
      </Box>
    </Box>
  );
}
