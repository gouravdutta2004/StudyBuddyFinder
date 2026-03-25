import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Box, Drawer } from '@mui/material';
import { useState } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Matches from './pages/Matches';
import Connections from './pages/Connections';
import Sessions from './pages/Sessions';
import StudyRoom from './pages/StudyRoom';
import PublicGroups from './pages/PublicGroups';
import Messages from './pages/Messages';
import Support from './pages/Support';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import PomodoroFocus from './pages/PomodoroFocus'; // Added
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Billing from './pages/Billing';
import SupportWidget from './components/SupportWidget';
import Onboarding from './pages/Onboarding';
import Leaderboard from './pages/Leaderboard';
import GlobalAnnouncementBanner from './components/GlobalAnnouncementBanner';
import GroupDetails from './pages/GroupDetails';

import AIAssistantWidget from './components/AIAssistantWidget';
import CustomCursor from './components/CustomCursor';
import CommandPalette from './components/CommandPalette';
import React from 'react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#fff', padding: '2rem', background: '#991b1b', zIndex: 99999, position: 'fixed', inset: 0, overflow: 'auto' }}>
          <h1 style={{ fontWeight: 900 }}>Fatal React Component Crash</h1>
          <p style={{ fontWeight: 700, fontSize: '1.25rem' }}>{this.state.error.message}</p>
          <pre style={{ fontSize: '1rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#020617' : '#f8f9fa' }}>
      <CommandPalette />

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: 280, border: 'none' } }}>
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </Drawer>
      
      {/* Desktop Sidebar */}
      <Sidebar mobileOpen={false} setMobileOpen={() => {}} />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <GlobalAnnouncementBanner />
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" sx={{ flexGrow: 1, p: 0, overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>

      <SupportWidget />
      <AIAssistantWidget />
    </Box>
  );
};

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1000000000000-dummyclientid.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GlobalErrorBoundary>
      <ThemeProvider>
      <CustomCursor />
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/browse" element={<ProtectedRoute><Layout><Browse /></Layout></ProtectedRoute>} />
              <Route path="/matches" element={<ProtectedRoute><Layout><Matches /></Layout></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Layout><Connections /></Layout></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><Layout><Sessions /></Layout></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><Layout><PublicGroups /></Layout></ProtectedRoute>} />
              <Route path="/groups/:id" element={<ProtectedRoute><Layout><GroupDetails /></Layout></ProtectedRoute>} />
              <Route path="/study-room/:id" element={<ProtectedRoute><Layout><StudyRoom /></Layout></ProtectedRoute>} />
              <Route path="/focus" element={<ProtectedRoute><Layout><PomodoroFocus /></Layout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Layout><Support /></Layout></ProtectedRoute>} />
              <Route path="/user/:id" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><Layout><Billing /></Layout></ProtectedRoute>} />
              <Route path="/admin/user/:id/edit" element={<AdminRoute><Layout><EditProfile /></Layout></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
    </GlobalErrorBoundary>
    </GoogleOAuthProvider>
  );
}
