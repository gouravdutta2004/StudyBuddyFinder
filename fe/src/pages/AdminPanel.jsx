import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Trash2, Shield, ShieldOff, CheckCircle, XCircle, Pencil, UserPlus, X, Users, Link2, Ban, Check, Activity, BarChart2, MessageSquare, MessageCircle, BookOpen, Sliders, Search, Sun, Moon, Mail, RefreshCw, Cpu, Database, Menu as MenuIcon, LogOut, Flame, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import EditProfile from './EditProfile';
import Messages from './Messages';
import GlobalAnnouncementBanner from '../components/GlobalAnnouncementBanner';
import UserQuickPeek from '../components/UserQuickPeek';
import GlobalActivityFeed from '../components/dashboard/GlobalActivityFeed';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Container, Grid, CardContent, TextField, Button, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Tooltip, 
  Select, MenuItem, InputAdornment, Tabs, Tab, Autocomplete
} from '@mui/material';

const drawerWidth = 260;

// --- Premium Card Component ---
function TiltCard({ children, sx, onClick }) {
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
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      style={{ rotateX, rotateY, perspective: 1000, display: 'flex', height: '100%', cursor: onClick ? 'pointer' : 'default' }}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.01 }} whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
    >
      <Box sx={{ 
        width: '100%', bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)', overflow: 'hidden', ...sx 
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const fadeUpSpring = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } } };

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.adminRole || 'Super Admin';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [activeUserTab, setActiveUserTab] = useState('regular');
  const [activeModerationTab, setActiveModerationTab] = useState('reports');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userFilter, setUserFilter] = useState('all');
  
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [siteConfig, setSiteConfig] = useState({ welcomeTitle: 'Welcome back, {name}! 👋', welcomeSubtitle: 'Find your perfect studyfriend and achieve your goals together.', showQuickActions: true, showSuggestedMatches: true, showStatCards: true, showProfileIncompleteBanner: true, announcementBannerActive: false, announcementBannerText: '', emailTemplateWelcome: '', emailTemplateReset: '', emailTemplateBroadcast: '' });
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER', organization: null, isActive: true });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ subject: '', message: '', targetUsers: 'all' });
  const [newSubject, setNewSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [dashboardStats, setDashboardStats] = useState({ totalUsers: 0, activeSessions: 0, reports: 0, dau: 0, dropOffs: 0 });
  const [growthData, setGrowthData] = useState([]);
  const [sessionStats, setSessionStats] = useState({ popularSubjects: [], peakHours: [] });
  const [systemHealth, setSystemHealth] = useState({ status: 'healthy', uptime: 0, dbState: 1, cpuUsage: 0, memoryUsage: 0, totalMem: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [openBadgeDialog, setOpenBadgeDialog] = useState(false);
  const [badgeInput, setBadgeInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, connRes, subRes, confRes, dashRes, growthRes, sessRes, healthRes, reportsRes, auditRes, flaggedRes, lbRes, orgsRes] = await Promise.all([
        api.get('/admin/users'), api.get('/admin/connections'), api.get('/admin/subjects'), api.get('/settings').catch(() => ({ data: {} })),
        api.get('/admin/analytics/dashboard').catch(() => ({ data: {} })), api.get('/admin/analytics/growth').catch(() => ({ data: [] })),
        api.get('/admin/analytics/sessions').catch(() => ({ data: [] })), api.get('/admin/health').catch(() => ({ data: {} })),
        api.get('/admin/reports').catch(() => ({ data: [] })), api.get('/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/admin/content-scan').catch(() => ({ data: [] })), api.get('/admin/gamification/leaderboard').catch(() => ({ data: [] })),
        api.get('/auth/organizations').catch(() => ({ data: [] }))
      ]);
      setUsers(userRes.data); setConnections(connRes.data); setSubjects(subRes.data);
      if (confRes.data && Object.keys(confRes.data).length > 0) setSiteConfig(confRes.data);
      if (dashRes.data && Object.keys(dashRes.data).length > 0) setDashboardStats(dashRes.data);
      setGrowthData(growthRes.data); setSessionStats(sessRes.data);
      if (healthRes.data && Object.keys(healthRes.data).length > 0) setSystemHealth(healthRes.data);
      setReports(reportsRes.data); setAuditLogs(auditRes.data); setFlaggedContent(flaggedRes.data);
      setLeaderboard(lbRes.data);
      setOrganizations(orgsRes.data || []);
    } catch { toast.error('Failed to load dashboard metrics'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDrawerToggle = () => { setMobileOpen(!mobileOpen); };

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleAdmin = async (id, currentStatus, email) => {
    if (email === 'admin@test.com') return toast.error('Cannot revoke Super Admin privileges');
    try { await api.put(`/admin/users/${id}`, { isAdmin: !currentStatus }); toast.success(`User admin privileges updated`); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const toggleBlock = async (id, currentStatus, email) => {
    if (email === 'admin@test.com') return toast.error('Cannot block Super Admin');
    try { await api.put(`/admin/users/${id}`, { isActive: !currentStatus }); toast.success(`User access updated`); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Block action failed'); }
  };

  const deleteUser = async (id) => {
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault(); setSaving(true);
    if (form.role === 'ORG_ADMIN' && !form.organization) {
      toast.error('Organization MUST be specified for Institution Admins');
      setSaving(false); return;
    }
    try { await api.post('/admin/users', form); toast.success('Entity Successfully Spawnded'); setShowModal(false); setForm({ name: '', email: '', password: '', role: 'USER', organization: null, isActive: true }); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/admin/broadcast', broadcastForm); toast.success('Mass Email Dispatched!'); setShowBroadcastModal(false); setBroadcastForm({ subject: '', message: '', targetUsers: 'all' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Email broadcast failed.'); }
    finally { setSaving(false); }
  };

  const handleBulkAction = async (action) => {
    if (!selectedUserIds.length || !window.confirm(`Bulk ${action} ${selectedUserIds.length} users?`)) return;
    setSaving(true);
    try { await api.post('/admin/users/bulk', { userIds: selectedUserIds, action }); toast.success(`Executed bulk ${action}`); setSelectedUserIds([]); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Bulk action failed'); }
    finally { setSaving(false); }
  };

  const severConnection = async (userA, userB) => {
    if (!window.confirm('Sever this connection?')) return;
    try { await api.delete(`/admin/connections/${userA}/${userB}`); toast.success('Connection severed'); fetchData(); }
    catch (err) { toast.error('Failed to sever connection'); }
  };

  const updateFeedback = async (id, newStatus) => {
    try { await api.put(`/admin/reports/${id}`, { status: newStatus }); toast.success(`Report marked ${newStatus}`); fetchData(); }
    catch (err) { toast.error('Update failed'); }
  };

  const handleModerationAction = async (userId, action) => {
    try {
      if (action === 'warn') { await api.post('/admin/broadcast', { targetUsers: [userId], subject: 'Official Warning', message: 'Violation detected. Please adjust behavior.' }); toast.success('Warning dispatched'); }
      else if (action === 'block') { await api.put(`/admin/users/${userId}`, { isActive: false }); toast.success('Account suspended'); fetchData(); }
    } catch (err) { toast.error('Moderation action failed'); }
  };

  const updateFlaggedItem = async (id, newStatus, userId, action) => {
    try { if (action) await handleModerationAction(userId, action); await api.put(`/admin/flagged-items/${id}`, { status: newStatus }); toast.success(`Resolved.`); fetchData(); }
    catch (err) { toast.error('Resolution failed'); }
  };

  const createSubject = async (e) => {
    e.preventDefault();
    try { await api.post('/admin/subjects', { name: newSubject }); toast.success('Global Subject created'); setNewSubject(''); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to add subject'); }
  };

  const deleteSubject = async (id) => {
    if (role !== 'Super Admin') return toast.error('Access Denied');
    if (!window.confirm('Delete Subject?')) return;
    try { await api.delete(`/admin/subjects/${id}`); toast.success('Subject erased'); fetchData(); }
    catch (err) { toast.error('Deletion failed'); }
  };

  const updateSiteConfig = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.put('/settings', siteConfig); toast.success('Config synchronized globally'); }
    catch { toast.error('Failed to sync configs'); }
    finally { setSaving(false); }
  };

  const exportUsersCSV = () => {
    const headers = ['Database ID', 'Name', 'Email', 'Active Status', 'Subjects', 'Study Style', 'Location', 'Member Since'];
    const csvContent = [headers.join(','), ...filteredRegularUsers.map(u => [`"${u._id}"`, `"${u.name}"`, `"${u.email}"`, u.isActive ? 'Active' : 'Banned', `"${(u.subjects || []).join('; ')}"`, `"${u.studyStyle || 'N/A'}"`, `"${u.location || 'N/A'}"`, `"${new Date(u.createdAt).toLocaleDateString()}"`].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'studyfriend_users.csv'; anchor.click(); URL.revokeObjectURL(url);
    toast.success('Exported CSV');
  };

  const admins = users.filter(u => u.isAdmin);
  let regularUsers = users.filter(u => !u.isAdmin);

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  if (userFilter === 'dau') regularUsers = regularUsers.filter(u => new Date(u.lastStudyDate) >= startOfToday);
  else if (userFilter === 'dropoffs') regularUsers = regularUsers.filter(u => !u.subjects?.length || !u.studyStyle);

  const getValuesDeep = (obj) => {
    if (typeof obj === 'string') return obj.toLowerCase() + ' ';
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj).toLowerCase() + ' ';
    if (Array.isArray(obj)) return obj.map(getValuesDeep).join('');
    if (typeof obj === 'object' && obj !== null) return Object.values(obj).map(getValuesDeep).join('');
    return '';
  };
  const deepSearch = (obj, term) => !term || getValuesDeep(obj).includes(term.toLowerCase());

  const filteredAdmins = admins.filter(u => deepSearch(u, searchQuery));
  const filteredRegularUsers = regularUsers.filter(u => deepSearch(u, searchQuery));
  const filteredConnections = connections.filter(conn => deepSearch(conn, searchQuery));
  const filteredSubjects = subjects.filter(s => deepSearch(s, searchQuery));

  const statCards = [
    { label: 'Total Accounts', value: dashboardStats.totalUsers || regularUsers.length, icon: Users, color: '#3b82f6' },
    { label: 'Daily Active (DAU)', value: dashboardStats.dau || 0, icon: Sun, color: '#f59e0b' },
    { label: 'Onboarding Drops', value: dashboardStats.dropOffs || 0, icon: XCircle, color: '#ef4444' },
    { label: 'Pending Reports', value: reports.filter(r => r.status === 'pending').length || dashboardStats.reports || 0, icon: MessageSquare, color: '#ec4899' },
  ];

  const handleStatClick = (label) => {
    switch (label) {
      case 'Total Accounts': setActiveTab('users'); setActiveUserTab('regular'); setUserFilter('all'); break;
      case 'Daily Active (DAU)': setActiveTab('users'); setActiveUserTab('regular'); setUserFilter('dau'); break;
      case 'Onboarding Drops': setActiveTab('users'); setActiveUserTab('regular'); setUserFilter('dropoffs'); break;
      case 'Pending Reports': setActiveTab('feedback'); setActiveModerationTab('reports'); break;
      default: break;
    }
  };

  const pieData = (sessionStats.popularSubjects || []).map(s => ({ name: s._id || 'Unsorted', value: s.count }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const barData = growthData.map(g => ({ name: (g._id || '').substring(5), total: g.users }));

  const menuItems = [
    { id: 'dashboard', icon: BarChart2, label: 'Analytics', roles: ['Super Admin', 'Moderator'] },
    { id: 'gamification', icon: Trophy, label: 'Leaderboards', roles: ['Super Admin', 'Moderator'] },
    { id: 'users', icon: Users, label: 'Manage Entities', roles: ['Super Admin', 'Moderator'] },
    { id: 'feedback', icon: MessageSquare, label: 'Moderation Hub', roles: ['Super Admin', 'Moderator', 'Support Agent'] },
    { id: 'subjects', icon: BookOpen, label: 'Topics', roles: ['Super Admin', 'Moderator'] },
    { id: 'messages', icon: MessageCircle, label: 'Support Chat', roles: ['Super Admin', 'Support Agent'] },
    { id: 'audit', icon: Shield, label: 'Audit Trail', roles: ['Super Admin', 'Moderator', 'Support Agent'] },
    { id: 'communication', icon: Mail, label: 'Communications', roles: ['Super Admin'] }
  ].filter(t => t.roles.includes(role));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,255,255,0.05)', color: 'white' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
        <Box sx={{ p: 1, bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
          <Activity color="#818cf8" size={24} />
        </Box>
        <Typography variant="h6" fontWeight={900} color="white">Admin Matrix</Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      <List sx={{ flexGrow: 1, px: 2, py: 2, gap: 1, display: 'flex', flexDirection: 'column' }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton 
              selected={activeTab === item.id} 
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              sx={{ 
                borderRadius: '16px', mb: 0.5, color: activeTab === item.id ? 'white' : 'rgba(255,255,255,0.6)',
                bgcolor: activeTab === item.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
                '&.Mui-selected': { bgcolor: 'rgba(99, 102, 241, 0.15)', '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.25)' } }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: activeTab === item.id ? '#818cf8' : 'inherit' }}><item.icon size={20} /></ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: activeTab === item.id ? 800 : 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      <List sx={{ px: 2, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: '16px', color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><LogOut size={20} /></ListItemIcon>
            <ListItemText primary="Logout System" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#020617', color: 'white' }}>
      <GlobalAnnouncementBanner isAdminPreview={true} />
      
      {/* Background Ambience */}
      <Box sx={{ position: 'fixed', top: '-10%', left: '-5%', width: 500, height: 500, bgcolor: 'rgba(99, 102, 241, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'fixed', bottom: '-10%', right: '-5%', width: 500, height: 500, bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }} />

      {/* App Bar */}
      <AppBar position="fixed" elevation={0} sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, bgcolor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
          <TextField
            size="small" placeholder="Deep System Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ 
              startAdornment: <InputAdornment position="start"><Search size={18} color="rgba(255,255,255,0.5)"/></InputAdornment>, 
              endAdornment: searchQuery ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery('')}><X size={16} color="rgba(255,255,255,0.5)"/></IconButton></InputAdornment> : null,
              sx: { borderRadius: '100px', bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '& fieldset': { border: 'none' } } 
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => fetchData()} sx={{ mr: 2, color: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.1)' }}><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></IconButton>
          {activeTab === 'users' && role === 'Super Admin' && (
            <Button variant="contained" startIcon={<UserPlus size={18}/>} onClick={() => setShowModal(true)} sx={{ borderRadius: '100px', fontWeight: 800, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
               Add User
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, zIndex: 1200 }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', bgcolor: 'transparent' } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none', bgcolor: 'transparent' } }} open>
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: 8, position: 'relative', zIndex: 10 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><RefreshCw className="animate-spin text-indigo-500" size={40} /></Box>
        ) : (
          <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible">
            
            {/* Analytics Dashboard Matrix Layout */}
            {activeTab === 'dashboard' && (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    <Box component={motion.div} variants={fadeUpSpring}>
                      <TiltCard sx={{ p: 4, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)', borderColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white">
                          <Activity color="#10b981" size={28} /> System Core Metrics
                        </Typography>
                        <Grid container spacing={3}>
                          {[
                            { label: 'Container Uptime', value: `${(systemHealth.uptime / 3600).toFixed(2)}h`, color: '#6366f1', icon: Activity },
                            { label: 'CPU Load', value: `${systemHealth.cpuUsage}%`, color: '#f59e0b', icon: Cpu },
                            { label: 'RAM Allocation', value: `${systemHealth.memoryUsage}%`, color: '#8b5cf6', icon: Database },
                            { label: 'API Env', value: systemHealth.status, color: '#10b981', icon: Check }
                          ].map((env, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                              <Box sx={{ p: 2.5, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography variant="caption" fontWeight={800} color="rgba(255,255,255,0.5)" display="flex" alignItems="center" gap={1} mb={1} textTransform="uppercase" letterSpacing={1}>
                                  <env.icon size={14}/> {env.label}
                                </Typography>
                                <Typography variant="h5" fontWeight={900} color={env.color} sx={{ textTransform: 'capitalize' }}>{env.value}</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </TiltCard>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6} component={motion.div} variants={fadeUpSpring}>
                        <TiltCard sx={{ p: 4, height: 400 }}>
                          <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)' }}><BookOpen size={20} color="#818cf8" /></Box>
                            Topic Ecosystem
                          </Typography>
                          <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <RechartsTooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', color: 'white', fontWeight: 800 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </TiltCard>
                      </Grid>
                      <Grid item xs={12} md={6} component={motion.div} variants={fadeUpSpring}>
                        <TiltCard sx={{ p: 4, height: 400 }}>
                          <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.1)' }}><Activity size={20} color="#34d399" /></Box>
                            Network Velocity
                          </Typography>
                          <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                              <RechartsTooltip cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }} contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', color: 'white', fontWeight: 800 }} />
                              <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </TiltCard>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {statCards.map((stat, i) => (
                      <Box component={motion.div} variants={fadeUpSpring} key={i}>
                        <TiltCard onClick={() => handleStatClick(stat.label)} sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                            <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 64, height: 64, borderRadius: '20px' }}><stat.icon size={32} /></Avatar>
                            <Box>
                              <Typography variant="h3" fontWeight={900} color="white">{stat.value}</Typography>
                              <Typography variant="caption" fontWeight={800} color="rgba(255,255,255,0.5)" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</Typography>
                            </Box>
                          </Box>
                        </TiltCard>
                      </Box>
                    ))}
                    <Box component={motion.div} variants={fadeUpSpring} sx={{ mt: 1, height: 400 }}>
                      <Box sx={{ height: '100%', bgcolor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden' }}>
                        <GlobalActivityFeed />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            )}

            {/* Entities Management (Users) */}
            {activeTab === 'users' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <Tabs value={activeUserTab} onChange={(e, val) => setActiveUserTab(val)} sx={{ mb: 4, '& .MuiTabs-indicator': { bgcolor: '#818cf8', height: 3, borderRadius: 3 }, '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 800 }, '& .Mui-selected': { color: 'white !important' } }}>
                  <Tab label="Standard Users" value="regular" />
                  <Tab label="System Administrators" value="admins" />
                  <Tab label="Global Connections" value="connections" />
                </Tabs>

                {(activeUserTab === 'regular' || activeUserTab === 'admins') && (
                  <TiltCard sx={{ borderRadius: '24px' }}>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(0,0,0,0.2)' }}>
                      <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                        <Users size={24} color="#818cf8" /> 
                        {activeUserTab === 'admins' ? 'System Administrators' : 'Standard Users'}
                        {userFilter !== 'all' && activeUserTab === 'regular' && (
                          <Chip size="small" label={userFilter === 'dau' ? 'Daily Active' : 'Onboarding Drops'} sx={{ bgcolor: '#818cf8', color: 'white', ml: 2, fontWeight: 800 }} onDelete={() => setUserFilter('all')} />
                        )}
                      </Typography>
                      {activeUserTab === 'regular' && (
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          {selectedUserIds.length > 0 && role === 'Super Admin' && (
                            <>
                              <Button size="small" variant="contained" sx={{ bgcolor: '#ef4444', color: 'white', borderRadius: '100px', fontWeight: 800 }} onClick={() => handleBulkAction('delete')}>Del ({selectedUserIds.length})</Button>
                              <Button size="small" variant="outlined" sx={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', borderRadius: '100px', fontWeight: 800 }} onClick={() => handleBulkAction('block')}>Block</Button>
                              <Button size="small" variant="contained" sx={{ bgcolor: '#8b5cf6', color: 'white', borderRadius: '100px', fontWeight: 800 }} onClick={() => { setBroadcastForm({...broadcastForm, targetUsers: selectedUserIds}); setShowBroadcastModal(true); }}>Email</Button>
                            </>
                          )}
                          <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', borderRadius: '100px', fontWeight: 800 }} onClick={exportUsersCSV}>Export CSV</Button>
                        </Box>
                      )}
                    </Box>
                    <TableContainer>
                      <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' } }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
                            {activeUserTab === 'regular' && (
                              <TableCell padding="checkbox">
                                <Checkbox sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#818cf8' } }} checked={filteredRegularUsers.length > 0 && selectedUserIds.length === filteredRegularUsers.length} onChange={e => setSelectedUserIds(e.target.checked ? filteredRegularUsers.map(u => u._id) : [])} />
                              </TableCell>
                            )}
                            <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Identity</Typography></TableCell>
                            <TableCell align="center"><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Status</Typography></TableCell>
                            <TableCell align="right"><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Actions</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(activeUserTab === 'admins' ? filteredAdmins : filteredRegularUsers).map(u => (
                            <TableRow key={u._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                              {activeUserTab === 'regular' && (
                                <TableCell padding="checkbox">
                                  <Checkbox sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#818cf8' } }} checked={selectedUserIds.includes(u._id)} onChange={e => { if (e.target.checked) setSelectedUserIds([...selectedUserIds, u._id]); else setSelectedUserIds(selectedUserIds.filter(id => id !== u._id)); }}/>
                                </TableCell>
                              )}
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <UserQuickPeek userId={u._id}>
                                    <Avatar src={u.avatar} sx={{ bgcolor: '#4f46e5', fontWeight: 900 }}>{u.name[0]}</Avatar>
                                  </UserQuickPeek>
                                  <Box>
                                    <Typography variant="body2" fontWeight={800} color={u.isActive ? 'white' : '#ef4444'}>{u.name}</Typography>
                                    <Typography variant="caption" color="rgba(255,255,255,0.5)" fontWeight={600}>{u.email}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ px: 2, py: 0.5, borderRadius: '100px', display: 'inline-block', bgcolor: u.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.isActive ? '#10b981' : '#ef4444', border: '1px solid', borderColor: u.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                                  <Typography variant="caption" fontWeight={800}>{u.isActive ? "ACTIVE" : "BANNED"}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <IconButton size="small" onClick={() => { setSelectedUserId(u._id); setActiveUserTab('edit-user'); }} sx={{ color: '#8b5cf6', bgcolor: 'rgba(139, 92, 246, 0.1)' }}><Pencil size={18}/></IconButton>
                                  <IconButton size="small" onClick={() => toggleBlock(u._id, u.isActive, u.email)} sx={{ color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)' }}><Ban size={18}/></IconButton>
                                  {role === 'Super Admin' && activeUserTab === 'regular' && <IconButton size="small" onClick={() => toggleAdmin(u._id, u.isAdmin, u.email)} sx={{ color: '#06b6d4', bgcolor: 'rgba(6, 182, 212, 0.1)' }}><Shield size={18}/></IconButton>}
                                  {role === 'Super Admin' && activeUserTab === 'admins' && <IconButton size="small" onClick={() => toggleAdmin(u._id, u.isAdmin, u.email)} sx={{ color: '#06b6d4', bgcolor: 'rgba(6, 182, 212, 0.1)' }}><ShieldOff size={18}/></IconButton>}
                                  {role === 'Super Admin' && <IconButton size="small" sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)', '&.Mui-disabled': { opacity: 0.3 } }} onClick={() => deleteUser(u._id)} disabled={u.email === 'admin@test.com'}><Trash2 size={18}/></IconButton>}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TiltCard>
                )}

                {activeUserTab === 'edit-user' && selectedUserId && (
                  <TiltCard>
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Typography variant="h5" fontWeight={900}>Administrative Editing Panel</Typography>
                      <Button size="small" startIcon={<X size={16}/>} sx={{ color: 'white' }} onClick={() => { setActiveUserTab('regular'); setSelectedUserId(null); }}>Close Panel</Button>
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      <EditProfile userId={selectedUserId} onComplete={() => { setActiveUserTab('regular'); setSelectedUserId(null); fetchData(); }} />
                    </CardContent>
                  </TiltCard>
                )}
              </Box>
            )}

            {/* Moderation Hub (Feedback) */}
            {activeTab === 'feedback' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Shield color="#f59e0b" size={28} /> Moderation Matrix</Typography>
                  <Tabs value={activeModerationTab} onChange={(e, val) => setActiveModerationTab(val)} sx={{ mb: 4, '& .MuiTabs-indicator': { bgcolor: '#818cf8', height: 3, borderRadius: 3 }, '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 800 }, '& .Mui-selected': { color: 'white !important' } }}>
                    <Tab label="User Reports" value="reports" />
                    <Tab label="Auto-Flagged Content" value="flagged" />
                  </Tabs>
                  
                  <TableContainer>
                    <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' } }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Entity/Reporter</Typography></TableCell>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Reason/Content</Typography></TableCell>
                          <TableCell align="center"><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Status</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Action</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeModerationTab === 'reports' ? (
                          reports.map(r => (
                            <TableRow key={r._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                              <TableCell>Reporter: {r.reporter?.name || 'Unknown'}<br/>Reported: {r.reportedUser?.name || 'Unknown'}</TableCell>
                              <TableCell>{r.reason}: {r.description}</TableCell>
                              <TableCell align="center"><Chip size="small" label={r.status} color={r.status === 'pending' ? 'warning' : 'success'} sx={{ fontWeight: 800 }} /></TableCell>
                              <TableCell align="right">
                                {r.status === 'pending' && <Button size="small" variant="outlined" color="success" onClick={() => updateFeedback(r._id, 'resolved')}>Resolve</Button>}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          flaggedContent.map(f => (
                            <TableRow key={f._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                              <TableCell>User: {f.user?.name || 'Unknown'}</TableCell>
                              <TableCell>{f.contentType}: {f.contentExcerpt}</TableCell>
                              <TableCell align="center"><Chip size="small" label={f.status} color={f.status === 'pending' ? 'warning' : 'success'} sx={{ fontWeight: 800 }} /></TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  {f.status === 'pending' && (
                                    <>
                                      <Button size="small" variant="outlined" color="success" onClick={() => updateFlaggedItem(f._id, 'cleared', f.user?._id, null)}>Clear</Button>
                                      <Button size="small" variant="contained" color="warning" onClick={() => updateFlaggedItem(f._id, 'actioned', f.user?._id, 'warn')}>Warn</Button>
                                    </>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TiltCard>
              </Box>
            )}

            {/* Subjects Management */}
            {activeTab === 'subjects' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight={900} display="flex" alignItems="center" gap={1.5} color="white"><BookOpen color="#3b82f6" size={28} /> Global Topics Hierarchy</Typography>
                  </Box>
                  <Box component="form" onSubmit={createSubject} sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <TextField size="small" fullWidth placeholder="New global subject designation..." value={newSubject} onChange={e => setNewSubject(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' } }} />
                    <Button type="submit" variant="contained" disabled={!newSubject} sx={{ bgcolor: '#3b82f6', fontWeight: 800 }}>Inject</Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {filteredSubjects.map(s => (
                      <Chip key={s._id} label={s.name} onDelete={role === 'Super Admin' ? () => deleteSubject(s._id) : undefined} 
                        sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 700, p: 1, '& .MuiChip-deleteIcon': { color: '#ef4444', '&:hover': { color: '#b91c1c' } } }} 
                      />
                    ))}
                  </Box>
                </TiltCard>
              </Box>
            )}

            {/* Communications & Settings */}
            {activeTab === 'communication' && role === 'Super Admin' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TiltCard sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Mail color="#ec4899" size={28} /> Mass Broadcast Command</Typography>
                      <Box component="form" onSubmit={handleBroadcast} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField select label="Target Demographic" SelectProps={{ native: true }} value={broadcastForm.targetUsers} onChange={e => setBroadcastForm({...broadcastForm, targetUsers: e.target.value})} fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }}>
                          <option value="all" style={{color: 'black'}}>All Entities</option>
                          <option value="active" style={{color: 'black'}}>Active Engaged</option>
                          <option value="inactive" style={{color: 'black'}}>Dormant / Drop-offs</option>
                        </TextField>
                        <TextField label="Transmission Subject" value={broadcastForm.subject} onChange={e => setBroadcastForm({...broadcastForm, subject: e.target.value})} fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} required />
                        <TextField label="Transmission Payload Markdown" multiline rows={6} value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} required />
                        <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#ec4899', fontWeight: 800, mt: 1 }}>{saving ? 'Transmitting...' : 'Dispatch Broadcast'}</Button>
                      </Box>
                    </TiltCard>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TiltCard sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Sliders color="#8b5cf6" size={28} /> Global App Config</Typography>
                      <Box component="form" align="left" onSubmit={updateSiteConfig} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControlLabel control={<Switch checked={siteConfig.announcementBannerActive} onChange={e => setSiteConfig({...siteConfig, announcementBannerActive: e.target.checked})} color="secondary" />} label={<Typography color="white" fontWeight={700}>Enable Global Announcement Banner</Typography>} />
                        <TextField label="Banner Content Markdown" value={siteConfig.announcementBannerText} onChange={e => setSiteConfig({...siteConfig, announcementBannerText: e.target.value})} fullWidth disabled={!siteConfig.announcementBannerActive} sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />
                        
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                        <Typography variant="subtitle2" color="rgba(255,255,255,0.5)" fontWeight={800} textTransform="uppercase">UI Elements Engine</Typography>
                        
                        <FormControlLabel control={<Switch checked={siteConfig.showQuickActions} onChange={e => setSiteConfig({...siteConfig, showQuickActions: e.target.checked})} color="secondary" />} label={<Typography color="white" fontWeight={700}>Show Quick Actions (User Panel)</Typography>} />
                        <FormControlLabel control={<Switch checked={siteConfig.showSuggestedMatches} onChange={e => setSiteConfig({...siteConfig, showSuggestedMatches: e.target.checked})} color="secondary" />} label={<Typography color="white" fontWeight={700}>Show Suggested Buddies Widget</Typography>} />
                        <FormControlLabel control={<Switch checked={siteConfig.showStatCards} onChange={e => setSiteConfig({...siteConfig, showStatCards: e.target.checked})} color="secondary" />} label={<Typography color="white" fontWeight={700}>Show User Stat Cards</Typography>} />
                        
                        <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#8b5cf6', fontWeight: 800, mt: 2 }}>{saving ? 'Syncing...' : 'Sync Config Hierarchy'}</Button>
                      </Box>
                    </TiltCard>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Audit Logs */}
            {activeTab === 'audit' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Shield color="#64748b" size={28} /> System Audit Trail</Typography>
                  <TableContainer>
                    <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' } }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Timestamp</Typography></TableCell>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Actor</Typography></TableCell>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Action Key</Typography></TableCell>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Target / Detail</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {auditLogs.map((log, i) => (
                          <TableRow key={i} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{log.adminName || 'System'}</TableCell>
                            <TableCell><Chip size="small" label={log.action} sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 800 }} /></TableCell>
                            <TableCell>{log.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TiltCard>
              </Box>
            )}

            {/* Gamification Hub */}
            {activeTab === 'gamification' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Trophy color="#f59e0b" size={28} /> Gamification Engine</Typography>
                  <TableContainer>
                    <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' } }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Rank</Typography></TableCell>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Entity</Typography></TableCell>
                          <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">XP / Level</Typography></TableCell>
                          <TableCell align="right"><Typography fontWeight={800} color="rgba(255,255,255,0.5)">God Action</Typography></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaderboard.map((lb, i) => (
                          <TableRow key={lb._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                            <TableCell><Typography variant="h6" fontWeight={900} color={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'white'}>#{i+1}</Typography></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar src={lb.avatar} sx={{ width: 32, height: 32 }} />
                                <Typography fontWeight={800}>{lb.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>Lvl {lb.level} ({lb.xp} XP)</TableCell>
                            <TableCell align="right">
                               <Button size="small" variant="outlined" sx={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)', borderRadius: '100px', fontWeight: 800 }} onClick={() => { setSelectedUser(lb); setOpenBadgeDialog(true); }}>Award Badge</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TiltCard>
              </Box>
            )}

            {/* Support Chat / Messages natively mounted for Super Admins / Agents */}
            {activeTab === 'messages' && (
              <Box component={motion.div} variants={fadeUpSpring} sx={{ height: '75vh' }}>
                 <TiltCard sx={{ p: 0, height: '100%', overflow: 'hidden' }}>
                    <Messages />
                 </TiltCard>
              </Box>
            )}

          </Box>
        )}
      </Box>

      {/* Broadcast Modal Dialog */}
      <Dialog open={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} PaperProps={{ sx: { bgcolor: '#0f172a', color: 'white', borderRadius: '24px', minWidth: 400, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <DialogTitle sx={{ fontWeight: 900, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Targeted Broadcast</DialogTitle>
        <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
           <Typography variant="body2" color="rgba(255,255,255,0.6)">Transmitting to {broadcastForm.targetUsers?.length || 0} selected entities.</Typography>
           <TextField label="Subject" value={broadcastForm.subject} onChange={e => setBroadcastForm({...broadcastForm, subject: e.target.value})} fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />
           <TextField label="Message" multiline rows={4} value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button onClick={() => setShowBroadcastModal(false)} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Abort</Button>
          <Button onClick={handleBroadcast} variant="contained" disabled={saving} sx={{ bgcolor: '#ec4899', fontWeight: 800 }}>{saving ? 'Transmitting...' : 'Dispatch'}</Button>
        </DialogActions>
      </Dialog>
      
      {/* Create User Dialog */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} PaperProps={{ sx: { bgcolor: '#0f172a', color: 'white', borderRadius: '24px', minWidth: 450, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <form onSubmit={handleCreateUser}>
          <DialogTitle sx={{ fontWeight: 900, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Spawn New Entity</DialogTitle>
          <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
             <TextField label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} fullWidth required sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />
             <TextField label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} fullWidth required sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />
             <TextField label="Secure Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} fullWidth required sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />
             
             <TextField select label="Entity Matrix Role" value={form.role} onChange={e => setForm({...form, role: e.target.value, organization: null})} fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} SelectProps={{ native: true }}>
               <option value="USER" style={{color: 'black'}}>Standard Global Student</option>
               <option value="ORG_ADMIN" style={{color: 'black'}}>Institution Administrator</option>
               <option value="SUPER_ADMIN" style={{color: 'black'}}>System Super Admin</option>
             </TextField>
             
             {form.role === 'ORG_ADMIN' && (
                <Autocomplete
                  options={organizations}
                  getOptionLabel={(option) => option.name || ""}
                  onChange={(event, newValue) => {
                    setForm({ ...form, organization: newValue ? newValue._id : null });
                  }}
                  renderInput={(params) => <TextField {...params} label="Bind to Institution" required fullWidth sx={{ '& .MuiInputBase-input': { color: 'white' }, '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' } }} />}
                />
             )}
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Button onClick={() => setShowModal(false)} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Abort</Button>
            <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#8b5cf6', fontWeight: 800 }}>{saving ? 'Spawning...' : 'Provision Entity'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
