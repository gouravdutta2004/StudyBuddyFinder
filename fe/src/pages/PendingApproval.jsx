import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#020617', p: 2, position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Orbs */}
      <Box sx={{ position: 'absolute', top: '20%', left: '10%', width: 500, height: 500, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 100 }}>
          <Box sx={{ 
            p: 5, borderRadius: '32px', backdropFilter: 'blur(24px)', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', textAlign: 'center'
          }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '24px', bgcolor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <ShieldAlert size={40} color="#fbbf24" />
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'white', letterSpacing: '-1px', mb: 2 }}>
              Account Pending Approval
            </Typography>
            
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.6 }}>
              Hi {user?.name}, your registration has been received! Because you signed up with a personal email, your account requires manual verification by your strictly walled-garden <strong>Organization Administrator</strong> before you can access the network. 
              <br /><br />
              Please check back later or contact your institution directly.
            </Typography>

            <Button
              onClick={handleLogout}
              variant="outlined"
              startIcon={<LogOut size={18} />}
              sx={{ 
                py: 1.5, px: 4, borderRadius: '100px',
                color: 'white', borderColor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Sign out
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
