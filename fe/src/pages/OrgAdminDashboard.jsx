import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { Check, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function OrgAdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const res = await api.get('/admin/pending-users');
      setPendingUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch pending requests');
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
      setPendingUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
          <ShieldCheck color="#6366f1" size={24} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Organization Hub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your walled-garden network. Review and approve personal email sign-ups.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        {pendingUsers.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">No pending requests.</Typography>
            <Typography variant="body2" color="text.disabled">All quiet here! Your network is up to date.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date Applied</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingUsers.map((u) => (
                  <TableRow key={u._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>{u.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.email} size="small" variant="outlined" sx={{ bgcolor: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={loadingId === u._id}
                        onClick={() => handleAction(u._id, 'approve')}
                        startIcon={<Check size={16} />}
                        sx={{ mr: 1, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={loadingId === u._id}
                        onClick={() => handleAction(u._id, 'reject')}
                        startIcon={<X size={16} />}
                        color="error"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
