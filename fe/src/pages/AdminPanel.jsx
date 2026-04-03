import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Building, Trash2, Shield, ShieldOff, CheckCircle, XCircle, Pencil, UserPlus, X, Users, Link2, Ban, Check, Activity, BarChart2, MessageSquare, MessageCircle, BookOpen, Sliders, Search, Sun, Moon, Mail, RefreshCw, Cpu, Database, Menu as MenuIcon, LogOut, Flame, Trophy, Terminal, Zap, Globe, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import EditProfile from './EditProfile';
import Messages from './Messages';
import GlobalAnnouncementBanner from '../components/GlobalAnnouncementBanner';
import UserQuickPeek from '../components/UserQuickPeek';
import GlobalActivityFeed from '../components/dashboard/GlobalActivityFeed';
import InstitutionSelect from '../components/InstitutionSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Grid, TextField, Button, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Switch, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox, Tooltip, 
  Select, MenuItem, InputAdornment, Tabs, Tab, Autocomplete, LinearProgress
} from '@mui/material';

// ── Design Tokens ──
const C = {
  bg: '#050812',
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(99,102,241,0.15)',
  borderHover: 'rgba(99,102,241,0.35)',
  indigo: '#6366f1',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  red: '#ef4444',
  green: '#10b981',
  pink: '#ec4899',
  text: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.4)',
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

const RAIL_W = 64;
const DRAWER_W = 220;

// ── InsightCard: flat card with sweep shimmer, no 3D ──
function TiltCard({ children, sx, onClick }) {
  return (
    <motion.div
      style={{ display: 'flex', height: '100%', cursor: onClick ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
      whileHover={{ scale: onClick ? 1.01 : 1 }}
      whileTap={onClick ? { scale: 0.985 } : {}}
      onClick={onClick}
    >
      <Box sx={{
        width: '100%',
        bgcolor: C.surface,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${C.border}`,
        borderRadius: '14px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: C.borderHover,
          boxShadow: `0 0 0 1px ${C.border}, 0 8px 32px rgba(99,102,241,0.12)`,
        },
        ...sx
      }}>
        {children}
      </Box>
    </motion.div>
  );
}

// ── Pill status badge ──
function StatusPill({ label, color }) {
  const map = { active: C.green, banned: C.red, pending: C.amber, resolved: C.green, Pending: C.amber, Resolved: C.green, healthy: C.green };
  const c = map[label] || color || C.muted;
  return (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.2, py: 0.3, borderRadius: '6px',
      bgcolor: `${c}18`, border: `1px solid ${c}40`,
      color: c, fontFamily: C.mono, fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase'
    }}>
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
      {label}
    </Box>
  );
}

// ── KPI Card ──
function KpiCard({ label, value, icon: Icon, color, delta, onClick }) {
  return (
    <motion.div whileHover={{ y: -2 }} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}>
      <Box sx={{
        p: 2.5, borderRadius: '14px', bgcolor: C.surface, border: `1px solid ${C.border}`,
        transition: 'border-color .2s', height: '100%',
        '&:hover': { borderColor: color + '55' },
        position: 'relative', overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', bgcolor: color, opacity: 0.7 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ p: 1, bgcolor: color + '18', borderRadius: '8px' }}><Icon size={18} color={color} /></Box>
          {delta !== undefined && <Typography sx={{ fontFamily: C.mono, fontSize: '0.7rem', color: delta >= 0 ? C.green : C.red }}>{ delta >= 0 ? '+' : ''}{delta}%</Typography>}
        </Box>
        <Typography sx={{ fontFamily: C.mono, fontSize: '1.8rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</Typography>
        <Typography sx={{ fontSize: '0.72rem', color: C.muted, fontWeight: 600, mt: 0.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
      </Box>
    </motion.div>
  );
}

const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUpSpring = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } } };

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
  const [squads, setSquads] = useState([]);
  const [quests, setQuests] = useState([]);
  const [questInput, setQuestInput] = useState('');
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
  const [globalPendingUsers, setGlobalPendingUsers] = useState([]);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgForm, setNewOrgForm] = useState({ name: '', domain: '', authorizedAdmins: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [now, setNow] = useState(new Date());

  // ── Billing Pricing Control ──
  const DEFAULT_PRICING_CONFIG = {
    pro:   { basePrice: 799,  discount: 0, annualDiscount: 20 },
    squad: { basePrice: 1599, discount: 0, annualDiscount: 20 },
  };
  const [pricingConfig, setPricingConfig] = useState(DEFAULT_PRICING_CONFIG);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v); setCmdQuery(''); }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const ALL_CMDS = [
    { id: 'dashboard', label: 'Go to Analytics', shortcut: 'G A', icon: BarChart2 },
    { id: 'squads', label: 'Go to Squad Matrix', shortcut: 'G S', icon: Users },
    { id: 'gamification', label: 'Go to Leaderboards', shortcut: 'G L', icon: Trophy },
    { id: 'engine', label: 'Go to Platform Engine', shortcut: 'G E', icon: Sliders },
    { id: 'users', label: 'Go to Manage Entities', shortcut: 'G U', icon: Users },
    { id: 'institutions', label: 'Go to Walled Gardens', shortcut: 'G W', icon: Building },
    { id: 'feedback', label: 'Go to Moderation Hub', shortcut: 'G M', icon: Shield },
    { id: 'subjects', label: 'Go to Topics', shortcut: 'G T', icon: BookOpen },
    { id: 'messages', label: 'Go to Support Chat', shortcut: 'G C', icon: MessageCircle },
    { id: 'audit', label: 'Go to Audit Trail', shortcut: 'G X', icon: Activity },
    { id: 'communication', label: 'Go to Communications', shortcut: 'G B', icon: Mail },
  ];
  const filteredCmds = cmdQuery ? ALL_CMDS.filter(c => c.label.toLowerCase().includes(cmdQuery.toLowerCase())) : ALL_CMDS;

  // Fetch billing pricing config when engine tab is opened
  const fetchPricingConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/billing/pricing/admin');
      setPricingConfig({
        pro:   { basePrice: data.pro?.basePrice   || 799,  discount: data.pro?.discount   || 0, annualDiscount: data.pro?.annualDiscount   ?? 20 },
        squad: { basePrice: data.squad?.basePrice || 1599, discount: data.squad?.discount || 0, annualDiscount: data.squad?.annualDiscount ?? 20 },
      });
      setPricingLoaded(true);
    } catch {
      setPricingLoaded(true);
    }
  }, []);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    setPricingSaving(true);
    try {
      await api.put('/billing/pricing/admin', pricingConfig);
      toast.success('💰 Pricing updated globally! Billing & Landing pages now reflect the new prices.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update pricing');
    } finally { setPricingSaving(false); }
  };

  useEffect(() => {
    if (activeTab === 'engine' && !pricingLoaded) {
      fetchPricingConfig();
    }
  }, [activeTab, pricingLoaded, fetchPricingConfig]);

  const effectivePrice = (plan) => {
    const base = Number(pricingConfig[plan]?.basePrice) || 0;
    const disc = Math.min(Math.max(Number(pricingConfig[plan]?.discount) || 0, 0), 100);
    return Math.round(base * (1 - disc / 100));
  };

  const annualEffectivePrice = (plan) => {
    const monthly = effectivePrice(plan);
    const annDisc = Math.min(Math.max(Number(pricingConfig[plan]?.annualDiscount) || 0, 0), 100);
    return Math.round(monthly * (1 - annDisc / 100)); // per-month displayed for annual
  };

  const annualTotal = (plan) => annualEffectivePrice(plan) * 12;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, connRes, subRes, confRes, dashRes, growthRes, sessRes, healthRes, reportsRes, auditRes, flaggedRes, lbRes, orgsRes, pendingRes, feedbackRes, squadsRes, questsRes] = await Promise.all([
        api.get('/admin/users'), api.get('/admin/connections'), api.get('/admin/subjects'), api.get('/settings').catch(() => ({ data: {} })),
        api.get('/admin/analytics/dashboard').catch(() => ({ data: {} })), api.get('/admin/analytics/growth').catch(() => ({ data: [] })),
        api.get('/admin/analytics/sessions').catch(() => ({ data: [] })), api.get('/admin/health').catch(() => ({ data: {} })),
        api.get('/admin/reports').catch(() => ({ data: [] })), api.get('/admin/audit-logs').catch(() => ({ data: [] })),
        api.get('/admin/content-scan').catch(() => ({ data: [] })), api.get('/admin/gamification/leaderboard').catch(() => ({ data: [] })),
        api.get('/admin/organizations').catch(() => ({ data: [] })),
        api.get('/admin/pending-users/global').catch(() => ({ data: [] })),
        api.get('/admin/feedback').catch(() => ({ data: [] })),
        api.get('/admin/squads').catch(() => ({ data: [] })),
        api.get('/admin/gamification/quests').catch(() => ({ data: [] }))
      ]);
      setUsers(userRes.data); setConnections(connRes.data); setSubjects(subRes.data);
      if (confRes.data && Object.keys(confRes.data).length > 0) setSiteConfig(confRes.data);
      if (dashRes.data && Object.keys(dashRes.data).length > 0) setDashboardStats(dashRes.data);
      setGrowthData(growthRes.data); setSessionStats(sessRes.data);
      if (healthRes.data && Object.keys(healthRes.data).length > 0) setSystemHealth(healthRes.data);
      setReports(reportsRes.data); setAuditLogs(auditRes.data); setFlaggedContent(flaggedRes.data);
      setLeaderboard(lbRes.data);
      setOrganizations(orgsRes.data || []);
      setGlobalPendingUsers(pendingRes.data || []);
      setFeedback(feedbackRes.data || []);
      setSquads(squadsRes.data || []);
      setQuests(questsRes.data || []);
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

  const updatePlatformFeedback = async (id, newStatus) => {
    try { await api.put(`/admin/feedback/${id}`, { status: newStatus }); toast.success(`Feedback gracefully marked ${newStatus}`); fetchData(); }
    catch (err) { toast.error('Feedback update failed'); }
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

  const handleDisbandSquad = async (id) => {
    if (!window.confirm('WARNING God-Mode action: Force permanently disband this Squad?')) return;
    try { await api.delete(`/admin/squads/${id}`); toast.success('Squad completely vaporized'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to disband'); }
  };

  const handleInjectQuest = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.post('/admin/gamification/quests', { task: questInput }); toast.success('Global quest injected into system economy'); setQuestInput(''); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Injection failed'); }
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

  const handleCreateOrg = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/admin/organizations', newOrgForm);
      toast.success('Walled Garden Built Successfully');
      setShowOrgModal(false);
      setNewOrgForm({ name: '', domain: '', authorizedAdmins: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Matrix anomaly: Organization construction failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteOrg = async (id) => {
    if (!window.confirm('WARNING God-Mode action: Annihilate this Walled Garden and all memory of it completely?')) return;
    try { await api.delete(`/admin/organizations/${id}`); toast.success('Garden wiped from existence'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to execute deletion'); }
  };

  const handleGlobalPendingApprove = async (id) => {
    try { await api.put(`/admin/users/${id}/approve`); toast.success('Student explicitly approved to Walled Garden via God-Mode'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Approval cascade failed'); }
  };

  const handleGlobalPendingReject = async (id) => {
    try { await api.put(`/admin/users/${id}/reject`); toast.success('Student application violently rejected'); fetchData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Rejection failed'); }
  };

  const menuItems = [
    { id: 'dashboard', icon: BarChart2, label: 'Analytics', roles: ['Super Admin', 'Moderator'] },
    { id: 'squads', icon: Users, label: 'Squad Matrix', roles: ['Super Admin', 'Moderator'] },
    { id: 'gamification', icon: Trophy, label: 'Leaderboards & Economy', roles: ['Super Admin', 'Moderator'] },
    { id: 'engine', icon: Sliders, label: 'Platform Engine', roles: ['Super Admin'] },
    { id: 'users', icon: Users, label: 'Manage Entities', roles: ['Super Admin', 'Moderator'] },
    { id: 'institutions', icon: Building, label: 'Walled Gardens', roles: ['Super Admin'] },
    { id: 'feedback', icon: MessageSquare, label: 'Moderation Hub', roles: ['Super Admin', 'Moderator', 'Support Agent'] },
    { id: 'subjects', icon: BookOpen, label: 'Topics', roles: ['Super Admin', 'Moderator'] },
    { id: 'messages', icon: MessageCircle, label: 'Support Chat', roles: ['Super Admin', 'Support Agent'] },
    { id: 'audit', icon: Shield, label: 'Audit Trail', roles: ['Super Admin', 'Moderator', 'Support Agent'] },
    { id: 'communication', icon: Mail, label: 'Communications', roles: ['Super Admin'] }
  ].filter(t => t.roles.includes(role));

  // ── Sidebar Rail Content ──
  const sidebarContent = (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: `${C.bg}f0`, backdropFilter: 'blur(20px)',
      borderRight: `1px solid ${C.border}`, color: 'white',
      width: sidebarOpen ? DRAWER_W : RAIL_W,
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden'
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${C.indigo}22`, border: `1px solid ${C.indigo}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Terminal size={18} color={C.indigo} />
        </Box>
        {sidebarOpen && <Typography sx={{ fontFamily: C.mono, fontWeight: 800, fontSize: '0.82rem', color: 'white', whiteSpace: 'nowrap', letterSpacing: 1 }}>ADMIN MATRIX</Typography>}
      </Box>

      {/* Nav Items */}
      <List sx={{ flexGrow: 1, px: 0.75, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {menuItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <Tooltip key={item.id} title={!sidebarOpen ? item.label : ''} placement="right">
              <ListItemButton
                selected={active}
                onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                sx={{
                  borderRadius: '10px', px: 1.5, py: 1, minHeight: 40,
                  gap: 1.5, color: active ? 'white' : C.muted,
                  bgcolor: active ? `${C.indigo}22` : 'transparent',
                  '&:hover': { bgcolor: active ? `${C.indigo}33` : 'rgba(255,255,255,0.04)', color: 'white' },
                  '&.Mui-selected': { bgcolor: `${C.indigo}22`, '&:hover': { bgcolor: `${C.indigo}33` } },
                  transition: 'background .15s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: active ? C.indigo : 'inherit' }}><item.icon size={18} /></ListItemIcon>
                {sidebarOpen && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: active ? 700 : 500, noWrap: true }} />}
                {sidebarOpen && active && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: C.indigo, flexShrink: 0 }} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ p: 0.75, borderTop: `1px solid ${C.border}` }}>
        <Tooltip title={!sidebarOpen ? 'Logout' : ''} placement="right">
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: '10px', px: 1.5, py: 1, color: C.red, '&:hover': { bgcolor: `${C.red}12` } }}>
            <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}><LogOut size={18} /></ListItemIcon>
            {sidebarOpen && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 700 }} sx={{ ml: 1.5 }} />}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{ display: 'flex', minHeight: '100vh', bgcolor: C.bg, color: 'white', fontFamily: 'Inter, system-ui, sans-serif' }}
      onMouseEnter={() => {}}
    >
      <GlobalAnnouncementBanner isAdminPreview={true} />

      {/* Subtle grid background */}
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: `radial-gradient(${C.indigo}08 1px, transparent 1px)`, backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'fixed', top: '15%', right: '10%', width: 400, height: 400, bgcolor: `${C.indigo}06`, borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Command Bar (Top AppBar) ── */}
      <AppBar position="fixed" elevation={0} sx={{
        width: { md: `calc(100% - ${sidebarOpen ? DRAWER_W : RAIL_W}px)` },
        ml: { md: `${sidebarOpen ? DRAWER_W : RAIL_W}px` },
        bgcolor: `${C.bg}dd`, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.border}`,
        transition: 'width 0.22s, margin-left 0.22s',
      }}>
        <Toolbar sx={{ gap: 2, minHeight: '56px !important', px: { xs: 2, md: 3 } }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: C.muted, display: { md: 'none' } }}><MenuIcon size={20} /></IconButton>

          {/* Search */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            bgcolor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`,
            borderRadius: '10px', px: 1.5, py: 0.6, flex: 1, maxWidth: 380,
            cursor: 'text', transition: 'border-color .2s',
            '&:hover': { borderColor: C.indigo + '60' },
          }} onClick={() => { setCmdOpen(true); setCmdQuery(''); }}>
            <Search size={14} color={C.muted} />
            <Typography sx={{ color: C.muted, fontSize: '0.82rem', flex: 1, userSelect: 'none' }}>Search or jump to...</Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box sx={{ px: 0.6, py: 0.1, borderRadius: '4px', border: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: '0.62rem', color: C.muted }}>⌘K</Box>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Live clock */}
          <Typography sx={{ fontFamily: C.mono, fontSize: '0.72rem', color: C.muted, display: { xs: 'none', md: 'block' } }}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>

          {/* System pulse */}
          <Box sx={{ alignItems: 'center', gap: 0.8, bgcolor: `${C.green}12`, border: `1px solid ${C.green}30`, borderRadius: '8px', px: 1.2, py: 0.5, display: { xs: 'none', sm: 'flex' } }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.green, animation: 'pulse 2s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
            <Typography sx={{ fontFamily: C.mono, fontSize: '0.65rem', color: C.green, fontWeight: 700 }}>LIVE</Typography>
          </Box>

          {/* Role badge */}
          <Box sx={{ bgcolor: `${C.indigo}20`, border: `1px solid ${C.indigo}40`, borderRadius: '8px', px: 1.5, py: 0.5 }}>
            <Typography sx={{ fontFamily: C.mono, fontSize: '0.65rem', color: C.indigo, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{role}</Typography>
          </Box>

          <IconButton onClick={fetchData} sx={{ color: C.muted, '&:hover': { color: 'white' } }}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>

          {activeTab === 'users' && role === 'Super Admin' && (
            <Button variant="contained" startIcon={<UserPlus size={16} />} onClick={() => setShowModal(true)}
              sx={{ fontFamily: C.mono, fontSize: '0.72rem', fontWeight: 700, bgcolor: C.indigo, borderRadius: '8px', px: 2, py: 0.7, '&:hover': { bgcolor: '#4f46e5' }, boxShadow: 'none' }}>
              New User
            </Button>
          )}
        </Toolbar>
        {loading && <LinearProgress sx={{ height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: C.indigo } }} />}
      </AppBar>

      {/* ── Sidebar ── */}
      <Box
        component="nav"
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        sx={{ width: { md: sidebarOpen ? DRAWER_W : RAIL_W }, flexShrink: 0, zIndex: 1200, transition: 'width 0.22s', display: { xs: 'none', md: 'block' }, position: 'fixed', top: 0, left: 0, bottom: 0 }}
      >
        {sidebarContent}
      </Box>
      <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_W, border: 'none', bgcolor: 'transparent' } }}>
        {sidebarContent}
      </Drawer>

      {/* ── Main Content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, p: { xs: 2, md: 3.5 },
          ml: { md: `${sidebarOpen ? DRAWER_W : RAIL_W}px` },
          mt: '56px', position: 'relative', zIndex: 10,
          transition: 'margin-left 0.22s',
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        {loading && !users.length ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 2 }}>
            <Terminal size={36} color={C.indigo} />
            <Typography sx={{ fontFamily: C.mono, color: C.muted, fontSize: '0.8rem', letterSpacing: 2 }}>LOADING MATRIX DATA...</Typography>
          </Box>
        ) : (
          <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible">
            
            {/* ── Analytics Dashboard ── */}
            {activeTab === 'dashboard' && (
              <Box component={motion.div} variants={staggerContainer} initial="hidden" animate="visible">

                {/* Page title */}
                <Box component={motion.div} variants={fadeUpSpring} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ p: 1, bgcolor: `${C.indigo}18`, borderRadius: '10px', border: `1px solid ${C.indigo}30` }}><BarChart2 size={20} color={C.indigo} /></Box>
                  <Typography sx={{ fontFamily: C.mono, fontWeight: 800, fontSize: '1.1rem', letterSpacing: 0.5 }}>Analytics Overview</Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ px: 1.2, py: 0.4, borderRadius: '6px', border: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: '0.65rem', color: C.muted }}>UTC+{(new Date().getTimezoneOffset()/-60)}:00</Box>
                  </Box>
                </Box>

                {/* KPI Row — 4 cards */}
                <Grid container spacing={2} component={motion.div} variants={fadeUpSpring} sx={{ mb: 3 }}>
                  {[
                    { label: 'Total Users', value: dashboardStats.totalUsers || users.filter(u => !u.isAdmin).length, icon: Users, color: C.indigo, onClick: () => { setActiveTab('users'); setActiveUserTab('regular'); } },
                    { label: 'Daily Active (DAU)', value: dashboardStats.dau || 0, icon: Zap, color: C.amber, onClick: () => { setActiveTab('users'); setUserFilter('dau'); } },
                    { label: 'Onboarding Drops', value: dashboardStats.dropOffs || 0, icon: XCircle, color: C.red, onClick: () => { setActiveTab('users'); setUserFilter('dropoffs'); } },
                    { label: 'Pending Reports', value: reports.filter(r => r.status === 'pending').length, icon: MessageSquare, color: C.pink, onClick: () => { setActiveTab('feedback'); setActiveModerationTab('reports'); } },
                    { label: 'Active Squads', value: squads.length, icon: Users, color: C.cyan, onClick: () => setActiveTab('squads') },
                    { label: 'Global Subjects', value: subjects.length, icon: BookOpen, color: C.green },
                    { label: 'Organizations', value: organizations.length, icon: Building, color: '#8b5cf6', onClick: () => setActiveTab('institutions') },
                    { label: 'Audit Events', value: auditLogs.length, icon: Shield, color: C.muted.replace('0.4', '0.8'), onClick: () => setActiveTab('audit') },
                  ].map((card, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <KpiCard {...card} />
                    </Grid>
                  ))}
                </Grid>

                {/* Charts row */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Growth Area chart — wider */}
                  <Grid item xs={12} md={8} component={motion.div} variants={fadeUpSpring}>
                    <TiltCard sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: `${C.green}18` }}><Activity size={16} color={C.green} /></Box>
                          <Typography sx={{ fontFamily: C.mono, fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.5 }}>USER GROWTH</Typography>
                        </Box>
                        <Typography sx={{ fontFamily: C.mono, fontSize: '0.65rem', color: C.muted }}>Last {barData.length} periods</Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={barData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.indigo} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={`${C.border}`} />
                          <XAxis dataKey="name" stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} dy={6} fontFamily={C.mono} />
                          <YAxis stroke={C.muted} fontSize={11} tickLine={false} axisLine={false} fontFamily={C.mono} />
                          <RechartsTooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${C.border}`, backgroundColor: '#0d1117', color: 'white', fontFamily: C.mono, fontSize: '0.75rem' }} />
                          <Area type="monotone" dataKey="total" stroke={C.indigo} strokeWidth={2.5} fillOpacity={1} fill="url(#gradG)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </TiltCard>
                  </Grid>

                  {/* Subject Pie */}
                  <Grid item xs={12} md={4} component={motion.div} variants={fadeUpSpring}>
                    <TiltCard sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: `${C.indigo}18` }}><BookOpen size={16} color={C.indigo} /></Box>
                        <Typography sx={{ fontFamily: C.mono, fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.5 }}>TOPIC SPLIT</Typography>
                      </Box>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData.length ? pieData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                            {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${C.border}`, backgroundColor: '#0d1117', color: 'white', fontFamily: C.mono, fontSize: '0.75rem' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
                        {pieData.slice(0, 4).map((s, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.62rem', fontFamily: C.mono, color: C.muted }}>{s.name}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </TiltCard>
                  </Grid>
                </Grid>

                {/* Bottom row: System Health + Activity Feed + Quick Actions */}
                <Grid container spacing={2}>

                  {/* System Health */}
                  <Grid item xs={12} md={5} component={motion.div} variants={fadeUpSpring}>
                    <TiltCard sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: `${C.green}18` }}><Cpu size={16} color={C.green} /></Box>
                        <Typography sx={{ fontFamily: C.mono, fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.5 }}>SYSTEM HEALTH</Typography>
                        <Box sx={{ ml: 'auto' }}><StatusPill label={systemHealth.status || 'healthy'} /></Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[
                          { label: 'CPU', value: systemHealth.cpuUsage || 0, color: C.amber, max: 100 },
                          { label: 'RAM', value: systemHealth.memoryUsage || 0, color: C.indigo, max: 100 },
                          { label: 'Uptime', value: ((systemHealth.uptime || 0) / 3600).toFixed(1), color: C.green, isText: true },
                          { label: 'DB State', value: systemHealth.dbState === 1 ? 'connected' : 'degraded', color: systemHealth.dbState === 1 ? C.green : C.red, isText: true },
                        ].map((m, i) => (
                          <Box key={i}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.label}</Typography>
                              <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: m.color, fontWeight: 700, textTransform: 'capitalize' }}>{m.isText ? m.value : `${m.value}%`}</Typography>
                            </Box>
                            {!m.isText && (
                              <Box sx={{ height: 4, borderRadius: 4, bgcolor: `${m.color}20`, overflow: 'hidden' }}>
                                <Box sx={{ width: `${Math.min(m.value, 100)}%`, height: '100%', bgcolor: m.color, transition: 'width 1s', borderRadius: 4 }} />
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </TiltCard>
                  </Grid>

                  {/* Live Activity Feed */}
                  <Grid item xs={12} md={4} component={motion.div} variants={fadeUpSpring}>
                    <TiltCard sx={{ overflow: 'hidden', height: 300 }}>
                      <GlobalActivityFeed />
                    </TiltCard>
                  </Grid>

                  {/* Quick Admin Actions */}
                  <Grid item xs={12} md={3} component={motion.div} variants={fadeUpSpring}>
                    <TiltCard sx={{ p: 3, height: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                        <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: `${C.cyan}18` }}><Zap size={16} color={C.cyan} /></Box>
                        <Typography sx={{ fontFamily: C.mono, fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.5 }}>QUICK ACTIONS</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {[
                          { label: 'Broadcast Email', icon: Mail, color: C.pink, action: () => setShowBroadcastModal(true) },
                          { label: 'Add New User', icon: UserPlus, color: C.indigo, action: () => { setActiveTab('users'); setShowModal(true); }, adminOnly: true },
                          { label: 'Inject Quest', icon: Flame, color: C.amber, action: () => setActiveTab('gamification') },
                          { label: 'Moderation Hub', icon: Shield, color: C.red, action: () => setActiveTab('feedback') },
                          { label: 'Platform Engine', icon: Sliders, color: C.green, action: () => setActiveTab('engine'), adminOnly: true },
                          { label: 'Audit Trail', icon: Activity, color: C.muted.replace('0.4','0.7'), action: () => setActiveTab('audit') },
                        ].filter(a => !a.adminOnly || role === 'Super Admin').map((a, i) => (
                          <Button key={i} onClick={a.action} fullWidth
                            sx={{
                              justifyContent: 'flex-start', gap: 1.5, px: 1.5, py: 1,
                              borderRadius: '8px', bgcolor: `${a.color}10`,
                              border: `1px solid ${a.color}25`, color: a.color,
                              fontFamily: C.mono, fontSize: '0.72rem', fontWeight: 700,
                              textTransform: 'none', letterSpacing: 0.3,
                              '&:hover': { bgcolor: `${a.color}20`, borderColor: `${a.color}50` },
                            }}
                          >
                            <a.icon size={15} />{a.label}
                          </Button>
                        ))}
                      </Box>
                    </TiltCard>
                  </Grid>

                </Grid>
              </Box>
            )}

            {/* Entities Management (Users) */}
            {activeTab === 'users' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                {/* Page header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box sx={{ p: 1, bgcolor: `${C.indigo}18`, borderRadius: '10px', border: `1px solid ${C.indigo}30` }}><Users size={20} color={C.indigo} /></Box>
                  <Typography sx={{ fontFamily: C.mono, fontWeight: 800, fontSize: '1.1rem', letterSpacing: 0.5 }}>Manage Entities</Typography>
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    {selectedUserIds.length > 0 && role === 'Super Admin' && (
                      <>
                        <Button size="small" sx={{ fontFamily: C.mono, fontSize: '0.7rem', bgcolor: `${C.red}18`, color: C.red, border: `1px solid ${C.red}40`, borderRadius: '8px' }} onClick={() => handleBulkAction('delete')}>Del ({selectedUserIds.length})</Button>
                        <Button size="small" sx={{ fontFamily: C.mono, fontSize: '0.7rem', bgcolor: `${C.amber}18`, color: C.amber, border: `1px solid ${C.amber}40`, borderRadius: '8px' }} onClick={() => handleBulkAction('block')}>Block</Button>
                      </>
                    )}
                    <Button size="small" sx={{ fontFamily: C.mono, fontSize: '0.7rem', bgcolor: `${C.cyan}12`, color: C.cyan, border: `1px solid ${C.cyan}30`, borderRadius: '8px' }} onClick={exportUsersCSV}>↓ CSV</Button>
                  </Box>
                </Box>
                <Tabs value={activeUserTab} onChange={(e, val) => setActiveUserTab(val)} sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: C.indigo, height: 2, borderRadius: 2 }, '& .MuiTab-root': { color: C.muted, fontFamily: C.mono, fontSize: '0.75rem', fontWeight: 600, minHeight: 36, textTransform: 'uppercase', letterSpacing: 0.8 }, '& .Mui-selected': { color: 'white !important' } }}>
                  <Tab label="Users" value="regular" />
                  <Tab label="Admins" value="admins" />
                  <Tab label="Connections" value="connections" />
                  <Tab label={`Approvals (${globalPendingUsers.length})`} value="approvals" />
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

                {activeUserTab === 'approvals' && (
                  <TiltCard sx={{ borderRadius: '24px' }}>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', bgcolor: 'rgba(0,0,0,0.2)' }}>
                      <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1.5}>
                        <Shield size={24} color="#f59e0b" /> 
                        Pending Identity Claims (Global)
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' } }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
                            <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Student</Typography></TableCell>
                            <TableCell><Typography fontWeight={800} color="rgba(255,255,255,0.5)">Target Walled Garden</Typography></TableCell>
                            <TableCell align="right"><Typography fontWeight={800} color="rgba(255,255,255,0.5)">God-Mode Action</Typography></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {globalPendingUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={3} align="center" sx={{ py: 6, color: 'rgba(255,255,255,0.3)' }}><ShieldOff size={48} style={{opacity:0.2, marginBottom:16}}/><br/>No pending claims across the matrix.</TableCell></TableRow>
                          ) : globalPendingUsers.map(u => (
                            <TableRow key={u._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar src={u.avatar} sx={{ bgcolor: '#4f46e5', fontWeight: 900 }}>{u.name[0]}</Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={800} color="white">{u.name}</Typography>
                                    <Typography variant="caption" color="rgba(255,255,255,0.5)" fontWeight={600}>{u.email}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip size="small" icon={<Building size={14} />} label={u.organization?.name || 'Unknown'} sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', fontWeight: 800 }} />
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  <Button size="small" variant="contained" sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 800, borderRadius: '8px' }} startIcon={<CheckCircle size={16}/>} onClick={() => handleGlobalPendingApprove(u._id)}>Approve</Button>
                                  <Button size="small" variant="outlined" sx={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', fontWeight: 800, borderRadius: '8px' }} startIcon={<XCircle size={16}/>} onClick={() => handleGlobalPendingReject(u._id)}>Reject</Button>
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

            {/* Walled Gardens Tab */}
            {activeTab === 'institutions' && role === 'Super Admin' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h4" fontWeight={900}>Walled Gardens Matrix</Typography>
                  <Button variant="contained" startIcon={<Building size={18} />} sx={{ bgcolor: '#8b5cf6', color: 'white', borderRadius: '100px', fontWeight: 800, px: 3, py: 1 }} onClick={() => setShowOrgModal(true)}>
                    Erect New Garden
                  </Button>
                </Box>
                <Grid container spacing={3}>
                  {organizations.map((org, i) => (
                    <Grid item xs={12} md={6} lg={4} key={org._id || i}>
                      <TiltCard sx={{ height: '100%', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
                        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: '16px' }}>
                              <Building size={32} color="#8b5cf6" />
                            </Box>
                            <IconButton size="small" onClick={() => handleDeleteOrg(org._id)} sx={{ color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' }}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                          <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>{org.name}</Typography>
                          <Typography variant="body2" color="#8b5cf6" fontWeight={800} sx={{ mb: 3 }}>@{org.domain}</Typography>
                          <Grid container spacing={2} sx={{ mt: 'auto' }}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography variant="caption" color="rgba(255,255,255,0.5)" fontWeight={800}>Total Students</Typography>
                                <Typography variant="h6" fontWeight={900}>{org.totalStudents || 0}</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <Typography variant="caption" color="#f59e0b" fontWeight={800}>Pending</Typography>
                                <Typography variant="h6" color="#f59e0b" fontWeight={900}>{org.pendingStudents || 0}</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </TiltCard>
                    </Grid>
                  ))}
                  {organizations.length === 0 && (
                     <Grid item xs={12}>
                       <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                         <Building size={48} color="rgba(255,255,255,0.1)" style={{marginBottom: 16}} />
                         <Typography variant="h6" color="rgba(255,255,255,0.5)" fontWeight={800}>No Walled Gardens Constructed</Typography>
                       </Box>
                     </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Squads Matrix Tab */}
            {activeTab === 'squads' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h4" fontWeight={900}>Global Squads Matrix</Typography>
                </Box>
                <Grid container spacing={3}>
                  {squads.map((squad) => (
                    <Grid item xs={12} md={6} lg={4} key={squad._id}>
                      <TiltCard sx={{ height: '100%', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #ec4899)' }} />
                        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px' }}>
                              <Users size={32} color="#3b82f6" />
                            </Box>
                            {role === 'Super Admin' && (
                              <Button size="small" variant="contained" sx={{ bgcolor: '#ef4444', color: 'white', fontWeight: 800, borderRadius: '8px' }} onClick={() => handleDisbandSquad(squad._id)}>
                                Force Disband
                              </Button>
                            )}
                          </Box>
                          <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>{squad.name}</Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)" mb={2} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{squad.description}</Typography>
                          <Typography variant="caption" color="#ec4899" fontWeight={800} sx={{ mb: 3 }}>Subject: {squad.subject}</Typography>
                          
                          <Grid container spacing={2} sx={{ mt: 'auto' }}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Typography variant="caption" color="rgba(255,255,255,0.5)" fontWeight={800}>Creator</Typography>
                                <Typography variant="body2" fontWeight={800} noWrap>{squad.creator?.name || 'Unknown'}</Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Typography variant="caption" color="#60a5fa" fontWeight={800}>Members</Typography>
                                <Typography variant="h6" color="#60a5fa" fontWeight={900}>{squad.members?.length || 0} / {squad.maxMembers}</Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </TiltCard>
                    </Grid>
                  ))}
                  {squads.length === 0 && (
                     <Grid item xs={12}>
                       <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                         <Users size={48} color="rgba(255,255,255,0.1)" style={{marginBottom: 16}} />
                         <Typography variant="h6" color="rgba(255,255,255,0.5)" fontWeight={800}>No Active Squads Detected</Typography>
                       </Box>
                     </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Platform Engine Tab */}
            {activeTab === 'engine' && role === 'Super Admin' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <Typography variant="h4" fontWeight={900} mb={4} display="flex" alignItems="center" gap={2} ><Sliders size={32} color="#f59e0b" /> Platform Core Engine</Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <TiltCard sx={{ p: 4, height: '100%' }}>
                      <Typography variant="h6" fontWeight={800} mb={3}>Global Feature Flags</Typography>
                      <Box component="form" onSubmit={updateSiteConfig} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControlLabel control={<Switch checked={siteConfig.showQuickActions} onChange={e => setSiteConfig({...siteConfig, showQuickActions: e.target.checked})} color="success" />} label={<Typography fontWeight={800}>Enable Quick Actions Dashboard</Typography>} />
                        <FormControlLabel control={<Switch checked={siteConfig.showSuggestedMatches} onChange={e => setSiteConfig({...siteConfig, showSuggestedMatches: e.target.checked})} color="success" />} label={<Typography fontWeight={800}>Enable AI Study Partner Matching</Typography>} />
                        <FormControlLabel control={<Switch checked={siteConfig.announcementBannerActive} onChange={e => setSiteConfig({...siteConfig, announcementBannerActive: e.target.checked})} color="success" />} label={<Typography fontWeight={800}>Activate Global Announcement Banner</Typography>} />
                        <TextField fullWidth size="small" label="Global Announcement Text" value={siteConfig.announcementBannerText} onChange={e => setSiteConfig({...siteConfig, announcementBannerText: e.target.value})} sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' }, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }} disabled={!siteConfig.announcementBannerActive} />
                        <Button type="submit" variant="contained" sx={{ mt: 2, bgcolor: '#f59e0b', color: 'black', fontWeight: 900 }} disabled={saving}>Compile & Sync Platform Rules</Button>
                      </Box>
                    </TiltCard>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TiltCard sx={{ p: 4, height: '100%' }}>
                      <Typography variant="h6" fontWeight={800} mb={3}>Onboarding Matrix Config</Typography>
                      <Box component="form" onSubmit={updateSiteConfig} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField fullWidth size="small" label="Welcome Title Template" value={siteConfig.welcomeTitle} onChange={e => setSiteConfig({...siteConfig, welcomeTitle: e.target.value})} sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' }, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }} helperText="Use {name} for user's given name." FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.4)' } }} />
                        <TextField fullWidth size="small" multiline rows={3} label="Welcome Subtitle Template" value={siteConfig.welcomeSubtitle} onChange={e => setSiteConfig({...siteConfig, welcomeSubtitle: e.target.value})} sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' }, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } } }} />
                        <Button type="submit" variant="contained" sx={{ mt: 2, bgcolor: '#f59e0b', color: 'black', fontWeight: 900 }} disabled={saving}>Compile & Sync Platform Rules</Button>
                      </Box>
                    </TiltCard>
                  </Grid>

                  {/* ─── Billing Price Control ─── */}
                  <Grid item xs={12}>
                    <TiltCard sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ p: 1, bgcolor: 'rgba(99,102,241,0.15)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)' }}>
                            <Zap size={20} color={C.indigo} />
                          </Box>
                          <Box>
                            <Typography variant="h6" fontWeight={900} color="white">Billing Price Control</Typography>
                            <Typography variant="caption" color={C.muted}>Changes propagate instantly to Billing page, Landing page, and Razorpay orders.</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {['pro','squad'].map(plan => (
                            <Box key={plan} sx={{ px: 2, py: 0.75, borderRadius: '10px', bgcolor: `${C.indigo}12`, border: `1px solid ${C.indigo}25`, textAlign: 'center', minWidth: 130 }}>
                              <Typography sx={{ fontFamily: C.mono, fontSize: '0.55rem', color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{plan} monthly</Typography>
                              <Typography sx={{ fontFamily: C.mono, fontSize: '1rem', fontWeight: 800, color: pricingConfig[plan]?.discount > 0 ? '#10b981' : 'white' }}>
                                ₹{effectivePrice(plan).toLocaleString('en-IN')}
                              </Typography>
                              <Typography sx={{ fontFamily: C.mono, fontSize: '0.55rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, mt: 0.5 }}>{plan} annual/mo</Typography>
                              <Typography sx={{ fontFamily: C.mono, fontSize: '0.9rem', fontWeight: 800, color: '#a78bfa' }}>
                                ₹{annualEffectivePrice(plan).toLocaleString('en-IN')}
                              </Typography>
                              {pricingConfig[plan]?.annualDiscount > 0 && (
                                <Typography sx={{ fontFamily: C.mono, fontSize: '0.55rem', color: '#a78bfa', fontWeight: 700 }}>
                                  {pricingConfig[plan].annualDiscount}% annual saving
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      <Box component="form" onSubmit={handleSavePricing}>
                        <Grid container spacing={3}>
                          {['pro','squad'].map((plan) => (
                            <Grid item xs={12} md={6} key={plan}>
                              <Box sx={{
                                p: 3, borderRadius: '14px',
                                border: `1px solid ${plan === 'pro' ? C.indigo : C.green}30`,
                                bgcolor: `${plan === 'pro' ? C.indigo : C.green}08`,
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                  <Box sx={{ p: 0.8, bgcolor: `${plan === 'pro' ? C.indigo : C.green}20`, borderRadius: '8px' }}>
                                    {plan === 'pro' ? <Zap size={16} color={C.indigo} /> : <Users size={16} color={C.green} />}
                                  </Box>
                                  <Typography sx={{ fontFamily: C.mono, fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 1, color: plan === 'pro' ? C.indigo : C.green }}>
                                    {plan === 'pro' ? 'Pro Plan' : 'Squad / Team Plan'}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                  <Box>
                                    <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.75 }}>Base Price (₹/month)</Typography>
                                    <TextField
                                      type="number"
                                      fullWidth
                                      size="small"
                                      inputProps={{ min: 1, step: 1 }}
                                      value={pricingConfig[plan]?.basePrice || ''}
                                      onChange={e => setPricingConfig(prev => ({ ...prev, [plan]: { ...prev[plan], basePrice: e.target.value } }))}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: C.mono, fontWeight: 700, fontSize: '1.05rem',
                                          '& fieldset': { borderColor: `${plan === 'pro' ? C.indigo : C.green}30` },
                                          '&:hover fieldset': { borderColor: `${plan === 'pro' ? C.indigo : C.green}60` },
                                          '&.Mui-focused fieldset': { borderColor: plan === 'pro' ? C.indigo : C.green },
                                        },
                                        '& input': { color: 'white', fontFamily: C.mono, fontWeight: 700 },
                                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
                                      }}
                                      InputProps={{
                                        startAdornment: <Box sx={{ mr: 0.5, fontFamily: C.mono, fontSize: '1rem', color: plan === 'pro' ? C.indigo : C.green, fontWeight: 800 }}>₹</Box>
                                      }}
                                    />
                                  </Box>

                                  <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                      <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Discount (%)</Typography>
                                      <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: pricingConfig[plan]?.discount > 0 ? '#10b981' : C.muted, fontWeight: 700 }}>
                                        {pricingConfig[plan]?.discount > 0 ? `₹${pricingConfig[plan].basePrice - effectivePrice(plan)} saved` : 'No discount'}
                                      </Typography>
                                    </Box>
                                    <TextField
                                      type="number"
                                      fullWidth
                                      size="small"
                                      inputProps={{ min: 0, max: 100, step: 1 }}
                                      value={pricingConfig[plan]?.discount || 0}
                                      onChange={e => setPricingConfig(prev => ({ ...prev, [plan]: { ...prev[plan], discount: Number(e.target.value) } }))}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: C.mono,
                                          '& fieldset': { borderColor: `${plan === 'pro' ? C.indigo : C.green}30` },
                                          '&:hover fieldset': { borderColor: `${plan === 'pro' ? C.indigo : C.green}60` },
                                          '&.Mui-focused fieldset': { borderColor: plan === 'pro' ? C.indigo : C.green },
                                        },
                                        '& input': { color: 'white', fontFamily: C.mono },
                                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
                                      }}
                                      InputProps={{
                                        endAdornment: <Box sx={{ ml: 0.5, fontFamily: C.mono, fontSize: '0.9rem', color: C.muted, fontWeight: 700 }}>%</Box>
                                      }}
                                    />
                                    {/* Visual discount slider */}
                                    <Box sx={{ mt: 1.5, height: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                      <Box sx={{
                                        height: '100%', borderRadius: 4,
                                        width: `${Math.min(Number(pricingConfig[plan]?.discount) || 0, 100)}%`,
                                        bgcolor: pricingConfig[plan]?.discount > 0 ? '#10b981' : 'transparent',
                                        transition: 'width 0.3s, background 0.2s',
                                        background: pricingConfig[plan]?.discount > 0 ? `linear-gradient(90deg, ${plan === 'pro' ? C.indigo : C.green}, #10b981)` : 'transparent',
                                      }} />
                                    </Box>
                                  </Box>

                                  {/* Annual Discount */}
                                  <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                                      <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.8 }}>📅 Annual Discount (%)</Typography>
                                      <Typography sx={{ fontFamily: C.mono, fontSize: '0.68rem', color: pricingConfig[plan]?.annualDiscount > 0 ? '#a78bfa' : C.muted, fontWeight: 700 }}>
                                        {pricingConfig[plan]?.annualDiscount > 0 ? `₹${annualEffectivePrice(plan).toLocaleString('en-IN')}/mo · ₹${annualTotal(plan).toLocaleString('en-IN')}/yr` : 'No annual discount'}
                                      </Typography>
                                    </Box>
                                    <TextField
                                      type="number"
                                      fullWidth
                                      size="small"
                                      inputProps={{ min: 0, max: 100, step: 1 }}
                                      value={pricingConfig[plan]?.annualDiscount ?? 0}
                                      onChange={e => setPricingConfig(prev => ({ ...prev, [plan]: { ...prev[plan], annualDiscount: Number(e.target.value) } }))}
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          bgcolor: 'rgba(167,139,250,0.05)', color: 'white', fontFamily: C.mono,
                                          '& fieldset': { borderColor: 'rgba(167,139,250,0.25)' },
                                          '&:hover fieldset': { borderColor: 'rgba(167,139,250,0.5)' },
                                          '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
                                        },
                                        '& input': { color: 'white', fontFamily: C.mono },
                                        '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
                                      }}
                                      InputProps={{ endAdornment: <Box sx={{ ml: 0.5, fontFamily: C.mono, fontSize: '0.9rem', color: '#a78bfa', fontWeight: 700 }}>%</Box> }}
                                    />
                                    <Box sx={{ mt: 1.5, height: 4, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                      <Box sx={{
                                        height: '100%', borderRadius: 4,
                                        width: `${Math.min(Number(pricingConfig[plan]?.annualDiscount) || 0, 100)}%`,
                                        transition: 'width 0.3s',
                                        background: pricingConfig[plan]?.annualDiscount > 0 ? 'linear-gradient(90deg, #7c3aed, #a78bfa)' : 'transparent',
                                      }} />
                                    </Box>
                                  </Box>

                                  {/* Live price preview */}
                                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                      <Typography sx={{ fontFamily: C.mono, fontSize: '0.65rem', color: C.muted }}>Monthly effective</Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {pricingConfig[plan]?.discount > 0 && (
                                          <Typography sx={{ fontFamily: C.mono, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                            ₹{Number(pricingConfig[plan]?.basePrice || 0).toLocaleString('en-IN')}
                                          </Typography>
                                        )}
                                        <Typography sx={{ fontFamily: C.mono, fontSize: '0.9rem', fontWeight: 800, color: pricingConfig[plan]?.discount > 0 ? '#10b981' : 'white' }}>
                                          ₹{effectivePrice(plan).toLocaleString('en-IN')}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography sx={{ fontFamily: C.mono, fontSize: '0.65rem', color: '#a78bfa' }}>Annual (per month)</Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {pricingConfig[plan]?.annualDiscount > 0 && (
                                          <Typography sx={{ fontFamily: C.mono, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>
                                            ₹{effectivePrice(plan).toLocaleString('en-IN')}
                                          </Typography>
                                        )}
                                        <Typography sx={{ fontFamily: C.mono, fontSize: '0.9rem', fontWeight: 800, color: '#a78bfa' }}>
                                          ₹{annualEffectivePrice(plan).toLocaleString('en-IN')}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Typography sx={{ fontFamily: C.mono, fontSize: '0.6rem', color: C.muted, mt: 0.5, textAlign: 'right' }}>
                                      Total billed annually: ₹{annualTotal(plan).toLocaleString('en-IN')}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={pricingSaving}
                            startIcon={<Zap size={16} />}
                            sx={{
                              bgcolor: C.indigo, fontWeight: 900, fontFamily: C.mono, fontSize: '0.82rem',
                              borderRadius: '10px', px: 3, py: 1.2, textTransform: 'none',
                              boxShadow: `0 4px 16px ${C.indigo}40`,
                              '&:hover': { bgcolor: '#4f46e5', boxShadow: `0 8px 24px ${C.indigo}60` },
                            }}
                          >
                            {pricingSaving ? 'Pushing to Global Ledger...' : 'Publish Prices Globally'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={fetchPricingConfig}
                            disabled={pricingSaving}
                            sx={{ borderColor: C.border, color: C.muted, fontFamily: C.mono, fontSize: '0.75rem', borderRadius: '10px', textTransform: 'none', '&:hover': { borderColor: C.indigo, color: 'white' } }}
                          >
                            Reload from DB
                          </Button>
                          <Typography sx={{ fontFamily: C.mono, fontSize: '0.65rem', color: C.muted, ml: 'auto' }}>
                            ⚡ Changes apply immediately to Billing, Landing & Razorpay
                          </Typography>
                        </Box>
                      </Box>
                    </TiltCard>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Moderation Hub (Feedback) */}
            {activeTab === 'feedback' && (
              <Box component={motion.div} variants={fadeUpSpring}>
                <TiltCard sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Shield color="#f59e0b" size={28} /> Moderation Matrix</Typography>
                  <Tabs value={activeModerationTab} onChange={(e, val) => setActiveModerationTab(val)} sx={{ mb: 4, '& .MuiTabs-indicator': { bgcolor: '#818cf8', height: 3, borderRadius: 3 }, '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 800 }, '& .Mui-selected': { color: 'white !important' } }}>
                    <Tab label="User Reports" value="reports" />
                    <Tab label="Platform Feedback" value="feedback" />
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
                        ) : activeModerationTab === 'feedback' ? (
                          feedback.map(f => (
                            <TableRow key={f._id} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={800} color="white">{f.user?.name || 'Unknown'}</Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.5)">{f.user?.email}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip size="small" label={f.type} sx={{ mb: 1, bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#818cf8', fontWeight: 800 }} /><br/>
                                <Typography variant="body2">{f.content}</Typography>
                              </TableCell>
                              <TableCell align="center"><Chip size="small" label={f.status} color={f.status === 'Pending' ? 'warning' : 'success'} sx={{ fontWeight: 800 }} /></TableCell>
                              <TableCell align="right">
                                {f.status === 'Pending' && <Button size="small" variant="contained" color="success" sx={{fontWeight: 800}} onClick={() => updatePlatformFeedback(f._id, 'Resolved')}>Resolve</Button>}
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h4" fontWeight={900} display="flex" alignItems="center" gap={2} color="white"><Trophy color="#f59e0b" size={32} /> Gamification Economy</Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={4}>
                     <TiltCard sx={{ p: 4, mb: 3 }}>
                       <Typography variant="h6" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Activity color="#10b981" size={24} /> Quest Injector</Typography>
                       <form onSubmit={handleInjectQuest}>
                         <TextField fullWidth size="small" placeholder="E.g. Study for 5 hours straight..." value={questInput} onChange={e => setQuestInput(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }, input: { color: 'white' } }} />
                         <Button type="submit" variant="contained" fullWidth sx={{ mt: 2, bgcolor: '#10b981', color: 'white', fontWeight: 800 }} disabled={!questInput || saving}>Drop Quest globally to all Users</Button>
                       </form>
                     </TiltCard>
                     <TiltCard sx={{ p: 3 }}>
                       <Typography variant="subtitle1" fontWeight={800} mb={2} color="rgba(255,255,255,0.5)">Currently Active Quests</Typography>
                       <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {quests.map(q => (
                             <Box key={q._id} sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                               <Typography variant="body2" fontWeight={800} color="#34d399">{q.task}</Typography>
                             </Box>
                          ))}
                          {quests.length === 0 && <Typography variant="caption" color="rgba(255,255,255,0.3)">No active quests.</Typography>}
                       </Box>
                     </TiltCard>
                  </Grid>
                  <Grid item xs={12} lg={8}>
                    <TiltCard sx={{ p: 4, height: '100%' }}>
                      <Typography variant="h6" fontWeight={900} mb={3} display="flex" alignItems="center" gap={1.5} color="white"><Trophy color="#f59e0b" size={24} /> Engine Leaderboard</Typography>
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
              </Grid>
             </Grid>
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
      {/* Create Walled Garden Modal */}
      <Dialog open={showOrgModal} onClose={() => setShowOrgModal(false)} PaperProps={{ sx: { bgcolor: '#0f172a', color: 'white', borderRadius: '24px', minWidth: 460, maxWidth: 560, border: '1px solid rgba(255,255,255,0.1)' } }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}><Building size={20} color="#8b5cf6"/> Construct Walled Garden</Typography>
          <IconButton size="small" onClick={() => setShowOrgModal(false)} sx={{ color: 'white' }}><X size={18}/></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>

          {/* University Lookup — auto-fills name & domain from HipoLabs proxy */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', mb: 1 }}>
              🔍 Auto-fill from Indian University Registry
            </Typography>
            <InstitutionSelect
              value={newOrgForm.name ? { name: newOrgForm.name, domains: [newOrgForm.domain] } : null}
              onChange={(uni) => {
                if (uni) {
                  setNewOrgForm(prev => ({
                    ...prev,
                    name: uni.name || prev.name,
                    domain: uni.domains?.[0] || prev.domain,
                  }));
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
              }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mt: 0.75, display: 'block' }}>
              Select a university to auto-fill the fields below, or fill them in manually.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 600, whiteSpace: 'nowrap' }}>OR FILL MANUALLY</Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.06)' }} />
          </Box>

          <TextField
            fullWidth label="Institution Name" variant="outlined"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.4)' } }, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' } }}
            value={newOrgForm.name}
            onChange={e => setNewOrgForm({...newOrgForm, name: e.target.value})}
            placeholder="e.g. Indian Institute of Technology Delhi"
          />
          <TextField
            fullWidth label="Allowed Email Domain" variant="outlined"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(139,92,246,0.4)' } }, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' } }}
            value={newOrgForm.domain}
            onChange={e => setNewOrgForm({...newOrgForm, domain: e.target.value})}
            placeholder="e.g. iitd.ac.in"
            helperText="Only users with this email domain will be allowed to join."
            FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.3)' } }}
          />
          <TextField
            fullWidth label="Admin Emails (comma-separated)" variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.02)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' } }, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.5)' } }}
            value={newOrgForm.authorizedAdmins}
            onChange={e => setNewOrgForm({...newOrgForm, authorizedAdmins: e.target.value})}
            placeholder="admin@iitd.ac.in, it@iitd.ac.in"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setShowOrgModal(false)} sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Cancel</Button>
          <Button onClick={handleCreateOrg} variant="contained" sx={{ bgcolor: '#8b5cf6', color: 'white', borderRadius: '12px', fontWeight: 800, px: 3 }} disabled={saving || !newOrgForm.name || !newOrgForm.domain}>
            {saving ? <Activity size={18} /> : 'Construct Matrix'}
          </Button>
        </DialogActions>
      </Dialog>
      
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

      {/* ── ⌘K Command Palette ── */}
      <AnimatePresence>
        {cmdOpen && (
          <Box
            sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: '15vh' }}
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{ width: '100%', maxWidth: 560 }}
            >
              <Box sx={{ bgcolor: '#0d1117', border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}>
                {/* Search input */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2, borderBottom: `1px solid ${C.border}` }}>
                  <Search size={18} color={C.muted} />
                  <input
                    autoFocus
                    value={cmdQuery}
                    onChange={e => setCmdQuery(e.target.value)}
                    placeholder="Type a command or search..."
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'Inter, sans-serif', fontSize: '1rem' }}
                  />
                  <Box sx={{ px: 0.8, py: 0.2, borderRadius: '5px', border: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: '0.62rem', color: C.muted }}>ESC</Box>
                </Box>
                {/* Results */}
                <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                  <Typography sx={{ px: 2.5, pt: 1.5, pb: 0.5, fontFamily: C.mono, fontSize: '0.62rem', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5 }}>Navigate</Typography>
                  {filteredCmds.map(cmd => (
                    <Box
                      key={cmd.id}
                      onClick={() => { setActiveTab(cmd.id); setCmdOpen(false); setCmdQuery(''); }}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5,
                        cursor: 'pointer', transition: 'background .1s',
                        '&:hover': { bgcolor: `${C.indigo}15` }
                      }}
                    >
                      <Box sx={{ p: 0.8, bgcolor: `${C.indigo}15`, borderRadius: '8px', display: 'flex' }}><cmd.icon size={16} color={C.indigo} /></Box>
                      <Typography sx={{ flex: 1, fontSize: '0.88rem', fontWeight: 500 }}>{cmd.label}</Typography>
                      <Box sx={{ px: 0.8, py: 0.2, borderRadius: '5px', border: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: '0.6rem', color: C.muted }}>{cmd.shortcut}</Box>
                    </Box>
                  ))}
                  {filteredCmds.length === 0 && (
                    <Box sx={{ px: 2.5, py: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontFamily: C.mono, color: C.muted, fontSize: '0.78rem' }}>No commands found</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
